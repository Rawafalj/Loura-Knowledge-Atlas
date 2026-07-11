from __future__ import annotations

import hashlib
import json
import tempfile
from pathlib import Path
from uuid import UUID

from loura_ingest_worker.config import WorkerConfig
from loura_ingest_worker.db import IngestionRepository
from loura_ingest_worker.errors import (
    ChecksumMismatchError,
    DuplicateSourceError,
    IngestionError,
    SourceTooLargeError,
    UnsupportedSourceError,
    sanitized_error,
)
from loura_ingest_worker.models import ClaimedMessage, SourceRecord
from loura_ingest_worker.parsing import DoclingParser
from loura_ingest_worker.segmentation import build_segments
from loura_ingest_worker.storage import PrivateStorageClient
from loura_ingest_worker.url_safety import ALLOWED_URL_MIME_TYPES, SafeUrlFetcher

ALLOWED_FILE_MIME_TYPES = ALLOWED_URL_MIME_TYPES | frozenset(
    {"image/png", "image/jpeg", "image/tiff"}
)


class IngestionPipeline:
    def __init__(
        self,
        config: WorkerConfig,
        repository: IngestionRepository,
        storage: PrivateStorageClient,
        parser: DoclingParser | None = None,
    ) -> None:
        self.config = config
        self.repository = repository
        self.storage = storage
        self.parser = parser or DoclingParser()

    def _load_original(self, source: SourceRecord) -> tuple[bytes, SourceRecord]:
        if source.storage_path:
            content = self.storage.download("source-files", source.storage_path)
            return content, source
        if source.origin != "url" or source.external_url is None:
            raise IngestionError
        fetched = SafeUrlFetcher(
            max_bytes=self.config.url_max_bytes,
            max_redirects=self.config.url_max_redirects,
        ).fetch(str(source.external_url))
        checksum = hashlib.sha256(fetched.content).hexdigest()
        duplicate = self.repository.find_duplicate_checksum(
            source.workspace_id, source.id, checksum
        )
        if duplicate is not None:
            raise DuplicateSourceError
        storage_path = "/".join(
            [str(source.workspace_id), str(source.id), checksum, fetched.file_name]
        )
        self.storage.upload_immutable(
            "source-files", storage_path, fetched.content, fetched.mime_type
        )
        self.repository.record_url_download(
            source.id,
            final_url=str(fetched.final_url),
            file_name=fetched.file_name,
            mime_type=fetched.mime_type,
            size_bytes=len(fetched.content),
            checksum=checksum,
            storage_path=storage_path,
        )
        return fetched.content, source.model_copy(
            update={
                "final_url": fetched.final_url,
                "file_name": fetched.file_name,
                "file_mime_type": fetched.mime_type,
                "file_size_bytes": len(fetched.content),
                "file_checksum_sha256": checksum,
                "storage_path": storage_path,
            }
        )

    def _validate_original(self, content: bytes, source: SourceRecord) -> str:
        if len(content) > self.config.source_max_bytes:
            raise SourceTooLargeError
        if source.file_mime_type not in ALLOWED_FILE_MIME_TYPES:
            raise UnsupportedSourceError
        checksum = hashlib.sha256(content).hexdigest()
        if checksum != source.file_checksum_sha256:
            raise ChecksumMismatchError
        return checksum

    def process(self, claimed: ClaimedMessage) -> bool:
        message = claimed.payload
        version_id: UUID | None = None
        try:
            job = self.repository.claim_job(message)
            if job.already_completed:
                return True
            self.repository.update_stage(message.job_id, "download", 10, "queued")
            content, source = self._load_original(job.source)
            checksum = self._validate_original(content, source)
            self.repository.update_stage(message.job_id, "parse", 30, "parsing")
            suffix = Path(source.file_name or "source.bin").suffix or ".bin"
            with tempfile.NamedTemporaryFile(suffix=suffix) as source_file:
                source_file.write(content)
                source_file.flush()
                parsed = self.parser.parse(Path(source_file.name))
            version_id, existing = self.repository.prepare_version(
                message,
                checksum=checksum,
                parser_name=parsed.parser_name,
                parser_version=parsed.parser_version,
            )
            if existing:
                self.repository.complete_existing(message, version_id)
                return True
            self.repository.update_stage(message.job_id, "persist", 60, "persisting")
            base_path = "/".join(
                [str(message.workspace_id), str(message.source_id), str(version_id)]
            )
            json_path = f"{base_path}/document.json"
            markdown_path = f"{base_path}/document.md"
            self.storage.upload_immutable(
                "source-derived",
                json_path,
                json.dumps(parsed.docling_json, sort_keys=True).encode("utf-8"),
                "application/json",
            )
            self.storage.upload_immutable(
                "source-derived",
                markdown_path,
                parsed.markdown.encode("utf-8"),
                "text/markdown",
            )
            self.repository.update_version_artifacts(
                version_id,
                json_path=json_path,
                markdown_path=markdown_path,
                extracted_metadata=parsed.extracted_metadata,
                page_count=parsed.page_count,
                language_code=parsed.language_code,
            )
            self.repository.update_stage(message.job_id, "segment", 80, "segmenting")
            segments = build_segments(parsed.blocks)
            if not segments:
                raise IngestionError
            self.repository.replace_segments(message.workspace_id, version_id, segments)
            self.repository.complete(message, version_id, len(segments))
            return True
        except Exception as error:
            code, public_message, retryable = sanitized_error(error)
            dead_letter = claimed.read_count >= self.config.max_attempts or not retryable
            self.repository.fail(
                message,
                version_id=version_id,
                code=code,
                public_message=public_message,
                dead_letter=dead_letter,
            )
            return dead_letter


def build_pipeline(config: WorkerConfig) -> IngestionPipeline:
    if not config.database_url or not config.supabase_url or not config.service_role_key:
        raise RuntimeError("ingestion processing is not configured")
    return IngestionPipeline(
        config,
        IngestionRepository(config.database_url),
        PrivateStorageClient(config.supabase_url, config.service_role_key),
    )
