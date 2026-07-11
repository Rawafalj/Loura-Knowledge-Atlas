import httpx
import pytest

from loura_ingest_worker.errors import UnsafeUrlError
from loura_ingest_worker.url_safety import SafeUrlFetcher, validate_public_url


def public_resolver(*args, **kwargs):
    del args, kwargs
    return [(2, 1, 6, "", ("93.184.216.34", 443))]


def private_resolver(*args, **kwargs):
    del args, kwargs
    return [(2, 1, 6, "", ("10.0.0.2", 443))]


def test_url_validation_rejects_non_http_and_private_addresses() -> None:
    with pytest.raises(UnsafeUrlError):
        validate_public_url("file:///etc/passwd", public_resolver)
    with pytest.raises(UnsafeUrlError):
        validate_public_url("http://internal.example/document", private_resolver)
    with pytest.raises(UnsafeUrlError):
        validate_public_url("http://127.0.0.1/document")


def test_url_fetch_revalidates_redirect_targets() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(302, headers={"location": "http://127.0.0.1/private"})

    fetcher = SafeUrlFetcher(
        max_bytes=1024,
        max_redirects=2,
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )
    with pytest.raises(UnsafeUrlError):
        fetcher.fetch("http://93.184.216.34/source")


def test_url_fetch_pins_the_validated_public_address() -> None:
    observed: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        observed["url"] = str(request.url)
        observed["host"] = request.headers["host"]
        observed["sni"] = str(request.extensions["sni_hostname"])
        return httpx.Response(
            200,
            headers={"content-type": "text/markdown"},
            content=b"# Safe fixture",
        )

    fetcher = SafeUrlFetcher(
        max_bytes=1024,
        max_redirects=0,
        client=httpx.Client(transport=httpx.MockTransport(handler)),
        resolver=public_resolver,
    )
    fetched = fetcher.fetch("https://docs.example/source.md")

    assert fetched.content == b"# Safe fixture"
    assert observed == {
        "url": "https://93.184.216.34/source.md",
        "host": "docs.example",
        "sni": "docs.example",
    }
