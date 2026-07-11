from __future__ import annotations

import ipaddress
import mimetypes
import socket
from collections.abc import Callable
from pathlib import PurePosixPath
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

import httpx

from loura_ingest_worker.errors import (
    SourceTooLargeError,
    TransientIngestionError,
    UnsafeUrlError,
    UnsupportedSourceError,
)
from loura_ingest_worker.models import FetchedUrl

ALLOWED_URL_MIME_TYPES = frozenset(
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/markdown",
        "text/html",
        "text/plain",
    }
)


def _is_public_address(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def resolve_public_addresses(
    hostname: str,
    resolver: Callable[..., object] = socket.getaddrinfo,
) -> tuple[str, ...]:
    try:
        resolved = resolver(hostname, 443, type=socket.SOCK_STREAM)
        if not isinstance(resolved, list):
            raise UnsafeUrlError
        addresses = tuple(
            sorted(
                {
                    str(entry[4][0])
                    for entry in resolved
                    if isinstance(entry, tuple)
                    and len(entry) >= 5
                    and isinstance(entry[4], tuple)
                    and entry[4]
                }
            )
        )
    except OSError as error:
        raise UnsafeUrlError from error
    if not addresses or any(not _is_public_address(address) for address in addresses):
        raise UnsafeUrlError
    return addresses


def validate_public_url(
    raw_url: str,
    resolver: Callable[..., object] = socket.getaddrinfo,
) -> str:
    try:
        parsed = urlsplit(raw_url)
    except ValueError as error:
        raise UnsafeUrlError from error
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise UnsafeUrlError
    if parsed.username or parsed.password or parsed.fragment:
        raise UnsafeUrlError
    if parsed.port not in {None, 80, 443}:
        raise UnsafeUrlError
    try:
        literal_address = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        resolve_public_addresses(parsed.hostname, resolver)
    else:
        if not _is_public_address(str(literal_address)):
            raise UnsafeUrlError
    return raw_url


def pinned_public_target(
    raw_url: str,
    resolver: Callable[..., object] = socket.getaddrinfo,
) -> tuple[str, str, str]:
    validated = validate_public_url(raw_url, resolver)
    parsed = urlsplit(validated)
    if parsed.hostname is None:
        raise UnsafeUrlError
    try:
        address = str(ipaddress.ip_address(parsed.hostname))
    except ValueError:
        address = resolve_public_addresses(parsed.hostname, resolver)[0]
    pinned_host = f"[{address}]" if ":" in address else address
    if parsed.port is not None:
        pinned_host = f"{pinned_host}:{parsed.port}"
    default_port = 443 if parsed.scheme == "https" else 80
    host_header = parsed.hostname
    if parsed.port is not None and parsed.port != default_port:
        host_header = f"{host_header}:{parsed.port}"
    return (
        urlunsplit((parsed.scheme, pinned_host, parsed.path, parsed.query, "")),
        host_header,
        parsed.hostname,
    )


def _filename_from_url(url: str, mime_type: str) -> str:
    candidate = PurePosixPath(unquote(urlsplit(url).path)).name
    if not candidate:
        candidate = "source"
    safe = "".join(
        character for character in candidate if character.isalnum() or character in "._- "
    )
    safe = safe.strip(" .")[:180] or "source"
    if "." not in safe:
        extension = mimetypes.guess_extension(mime_type) or ".bin"
        safe += extension
    return safe


class SafeUrlFetcher:
    def __init__(
        self,
        *,
        max_bytes: int,
        max_redirects: int,
        client: httpx.Client | None = None,
        resolver: Callable[..., object] = socket.getaddrinfo,
    ) -> None:
        self.max_bytes = max_bytes
        self.max_redirects = max_redirects
        self.client = client or httpx.Client(follow_redirects=False, timeout=30)
        self.resolver = resolver

    def fetch(self, raw_url: str) -> FetchedUrl:
        current_url = validate_public_url(raw_url, self.resolver)
        for redirect_count in range(self.max_redirects + 1):
            pinned_url, host_header, sni_hostname = pinned_public_target(current_url, self.resolver)
            try:
                with self.client.stream(
                    "GET",
                    pinned_url,
                    headers={
                        "Accept": ", ".join(sorted(ALLOWED_URL_MIME_TYPES)),
                        "Host": host_header,
                    },
                    extensions={"sni_hostname": sni_hostname},
                ) as response:
                    if response.status_code in {301, 302, 303, 307, 308}:
                        location = response.headers.get("location")
                        if not location or redirect_count >= self.max_redirects:
                            raise UnsafeUrlError
                        current_url = validate_public_url(
                            urljoin(current_url, location), self.resolver
                        )
                        continue
                    if response.status_code >= 500:
                        raise TransientIngestionError
                    if response.status_code >= 400:
                        raise UnsafeUrlError
                    content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
                    if content_type not in ALLOWED_URL_MIME_TYPES:
                        raise UnsupportedSourceError
                    declared_length = response.headers.get("content-length")
                    if declared_length and int(declared_length) > self.max_bytes:
                        raise SourceTooLargeError
                    chunks: list[bytes] = []
                    total = 0
                    for chunk in response.iter_bytes():
                        total += len(chunk)
                        if total > self.max_bytes:
                            raise SourceTooLargeError
                        chunks.append(chunk)
                    return FetchedUrl.model_validate(
                        {
                            "content": b"".join(chunks),
                            "final_url": current_url,
                            "mime_type": content_type,
                            "file_name": _filename_from_url(current_url, content_type),
                        }
                    )
            except httpx.TimeoutException as error:
                raise TransientIngestionError from error
            except httpx.TransportError as error:
                raise TransientIngestionError from error
        raise UnsafeUrlError
