from __future__ import annotations

from urllib.parse import quote

import httpx

from loura_ingest_worker.errors import IngestionError, TransientIngestionError


class PrivateStorageClient:
    def __init__(
        self,
        base_url: str,
        service_role_key: str,
        client: httpx.Client | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.client = client or httpx.Client(timeout=60)
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
        }

    def download(self, bucket: str, path: str) -> bytes:
        encoded_path = quote(path, safe="/")
        try:
            response = self.client.get(
                f"{self.base_url}/storage/v1/object/authenticated/{bucket}/{encoded_path}",
                headers=self.headers,
            )
        except httpx.TransportError as error:
            raise TransientIngestionError from error
        if response.status_code >= 500:
            raise TransientIngestionError
        if response.status_code != 200:
            raise IngestionError
        return response.content

    def upload_immutable(self, bucket: str, path: str, content: bytes, mime_type: str) -> None:
        encoded_path = quote(path, safe="/")
        headers = {**self.headers, "Content-Type": mime_type, "x-upsert": "false"}
        try:
            response = self.client.post(
                f"{self.base_url}/storage/v1/object/{bucket}/{encoded_path}",
                headers=headers,
                content=content,
            )
        except httpx.TransportError as error:
            raise TransientIngestionError from error
        if response.status_code in {200, 201, 409}:
            return
        if response.status_code >= 500:
            raise TransientIngestionError
        raise IngestionError
