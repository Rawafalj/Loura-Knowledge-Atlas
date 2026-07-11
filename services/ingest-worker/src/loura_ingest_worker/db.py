from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from loura_ingest_worker.errors import DuplicateSourceError, IngestionError
from loura_ingest_worker.models import QueueMessage, SourceRecord, SourceSegment
from loura_ingest_worker.segmentation import stable_segment_id


@dataclass(frozen=True)
class ClaimedJob:
    source: SourceRecord
    attempt_count: int
    already_completed: bool


class IngestionRepository:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def claim_job(self, message: QueueMessage) -> ClaimedJob:
        with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
            job = connection.execute(
                """
                select id, workspace_id, source_id, status, attempt_count
                from public.ingestion_jobs
                where id = %s
                for update
                """,
                (message.job_id,),
            ).fetchone()
            if job is None:
                raise IngestionError
            if str(job["workspace_id"]) != str(message.workspace_id) or str(
                job["source_id"]
            ) != str(message.source_id):
                raise IngestionError
            already_completed = job["status"] == "completed"
            attempt_count = int(job["attempt_count"])
            if not already_completed:
                updated = connection.execute(
                    """
                    update public.ingestion_jobs
                    set status = 'running', attempt_count = attempt_count + 1,
                        started_at = coalesce(started_at, now()), completed_at = null,
                        error_code = null, error_message_sanitized = null
                    where id = %s
                    returning attempt_count
                    """,
                    (message.job_id,),
                ).fetchone()
                if updated is None:
                    raise IngestionError
                attempt_count = int(updated["attempt_count"])
            source_row = connection.execute(
                """
                select id, workspace_id, origin, title, external_url, final_url,
                       file_name, file_mime_type, file_size_bytes, file_checksum_sha256,
                       storage_path, sensitivity, external_ai_policy
                from public.sources
                where id = %s and workspace_id = %s and deleted_at is null
                """,
                (message.source_id, message.workspace_id),
            ).fetchone()
            if source_row is None:
                raise IngestionError
        return ClaimedJob(
            source=SourceRecord.model_validate(source_row),
            attempt_count=attempt_count,
            already_completed=already_completed,
        )

    def update_stage(self, job_id: UUID, stage: str, progress: float, source_status: str) -> None:
        with psycopg.connect(self.database_url) as connection:
            row = connection.execute(
                """
                update public.ingestion_jobs set stage = %s, progress = %s
                where id = %s returning source_id
                """,
                (stage, progress, job_id),
            ).fetchone()
            if row is None:
                raise IngestionError
            connection.execute(
                "update public.sources set ingestion_status = %s where id = %s",
                (source_status, row[0]),
            )

    def find_duplicate_checksum(
        self, workspace_id: UUID, source_id: UUID, checksum: str
    ) -> UUID | None:
        with psycopg.connect(self.database_url) as connection:
            row = connection.execute(
                """
                select id from public.sources
                where workspace_id = %s and id <> %s and file_checksum_sha256 = %s
                  and deleted_at is null
                limit 1
                """,
                (workspace_id, source_id, checksum),
            ).fetchone()
        return UUID(str(row[0])) if row else None

    def record_url_download(
        self,
        source_id: UUID,
        *,
        final_url: str,
        file_name: str,
        mime_type: str,
        size_bytes: int,
        checksum: str,
        storage_path: str,
    ) -> None:
        try:
            with psycopg.connect(self.database_url) as connection:
                connection.execute(
                    """
                    update public.sources set
                      final_url = %s, file_name = %s, file_mime_type = %s,
                      file_size_bytes = %s, file_checksum_sha256 = %s, storage_path = %s
                    where id = %s
                    """,
                    (
                        final_url,
                        file_name,
                        mime_type,
                        size_bytes,
                        checksum,
                        storage_path,
                        source_id,
                    ),
                )
        except psycopg.errors.UniqueViolation as error:
            raise DuplicateSourceError from error

    def prepare_version(
        self,
        message: QueueMessage,
        *,
        checksum: str,
        parser_name: str,
        parser_version: str,
    ) -> tuple[UUID, bool]:
        idempotency_key = ":".join(
            [
                str(message.source_id),
                checksum,
                message.parser_profile,
                message.extraction_schema_version,
            ]
        )
        with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
            # Version numbers are scoped to a source. Lock that source before
            # computing MAX(version_number)+1 so different parser profiles or
            # checksums cannot race into the same version number.
            connection.execute(
                "select pg_advisory_xact_lock(hashtextextended(%s, 0))",
                (str(message.source_id),),
            )
            connection.execute(
                "select pg_advisory_xact_lock(hashtextextended(%s, 0))",
                (idempotency_key,),
            )
            existing = connection.execute(
                """
                select id, processing_status from public.source_versions
                where workspace_id = %s and idempotency_key = %s
                """,
                (message.workspace_id, idempotency_key),
            ).fetchone()
            if existing is not None and existing["processing_status"] == "completed":
                return UUID(str(existing["id"])), True
            if existing is not None:
                version_id = UUID(str(existing["id"]))
                connection.execute(
                    "delete from public.source_segments where source_version_id = %s",
                    (version_id,),
                )
                connection.execute(
                    """
                    update public.source_versions set
                      processing_status = 'processing', parser_name = %s, parser_version = %s,
                      parser_profile = %s, error_code = null,
                      error_message_sanitized = null, completed_at = null
                    where id = %s
                    """,
                    (parser_name, parser_version, message.parser_profile, version_id),
                )
                return version_id, False
            number_row = connection.execute(
                """
                select coalesce(max(version_number), 0) + 1 as next_version
                from public.source_versions where source_id = %s
                """,
                (message.source_id,),
            ).fetchone()
            if number_row is None:
                raise IngestionError
            created = connection.execute(
                """
                insert into public.source_versions (
                  workspace_id, source_id, version_number, idempotency_key,
                  file_checksum_sha256, parser_name, parser_version, parser_profile
                ) values (%s, %s, %s, %s, %s, %s, %s, %s)
                returning id
                """,
                (
                    message.workspace_id,
                    message.source_id,
                    int(number_row["next_version"]),
                    idempotency_key,
                    checksum,
                    parser_name,
                    parser_version,
                    message.parser_profile,
                ),
            ).fetchone()
            if created is None:
                raise IngestionError
            return UUID(str(created["id"])), False

    def update_version_artifacts(
        self,
        version_id: UUID,
        *,
        json_path: str,
        markdown_path: str,
        extracted_metadata: dict[str, Any],
        page_count: int | None,
        language_code: str | None,
    ) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                """
                update public.source_versions set
                  docling_json_path = %s, markdown_path = %s, extracted_metadata = %s,
                  page_count = %s, language_code = %s
                where id = %s and processing_status = 'processing'
                """,
                (
                    json_path,
                    markdown_path,
                    Jsonb(extracted_metadata),
                    page_count,
                    language_code,
                    version_id,
                ),
            )

    def replace_segments(
        self, workspace_id: UUID, version_id: UUID, segments: tuple[SourceSegment, ...]
    ) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                "delete from public.source_segments where source_version_id = %s",
                (version_id,),
            )
            with connection.cursor() as cursor:
                cursor.executemany(
                    """
                    insert into public.source_segments (
                      id, workspace_id, source_version_id, ordinal, stable_key, segment_type,
                      heading_path, text, token_count, page_start, page_end, provenance
                    ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    [
                        (
                            stable_segment_id(version_id, segment.stable_key),
                            workspace_id,
                            version_id,
                            segment.ordinal,
                            segment.stable_key,
                            segment.segment_type,
                            list(segment.heading_path),
                            segment.text,
                            segment.token_count,
                            segment.page_start,
                            segment.page_end,
                            Jsonb(segment.provenance),
                        )
                        for segment in segments
                    ],
                )

    def complete(self, message: QueueMessage, version_id: UUID, segment_count: int) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                """
                update public.source_versions set
                  processing_status = 'completed', completed_at = now()
                where id = %s and processing_status = 'processing'
                """,
                (version_id,),
            )
            connection.execute(
                """
                update public.sources set
                  ingestion_status = 'completed', latest_source_version_id = %s
                where id = %s
                """,
                (version_id, message.source_id),
            )
            connection.execute(
                """
                update public.ingestion_jobs set
                  source_version_id = %s, status = 'completed', stage = 'segment', progress = 100,
                  completed_at = now(), error_code = null, error_message_sanitized = null
                where id = %s
                """,
                (version_id, message.job_id),
            )
            connection.execute(
                """
                insert into public.audit_events (
                  workspace_id, actor_type, event_type, object_type, object_id,
                  summary, after_summary
                ) values (%s, 'worker', 'ingestion.completed', 'source_version', %s, %s, %s)
                """,
                (
                    message.workspace_id,
                    version_id,
                    "Completed deterministic source ingestion",
                    Jsonb({"sourceId": str(message.source_id), "segments": segment_count}),
                ),
            )

    def complete_existing(self, message: QueueMessage, version_id: UUID) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                """
                update public.sources set
                  ingestion_status = 'completed', latest_source_version_id = %s
                where id = %s
                """,
                (version_id, message.source_id),
            )
            connection.execute(
                """
                update public.ingestion_jobs set source_version_id = %s, status = 'completed',
                  stage = 'segment', progress = 100, completed_at = now()
                where id = %s
                """,
                (version_id, message.job_id),
            )

    def fail(
        self,
        message: QueueMessage,
        *,
        version_id: UUID | None,
        code: str,
        public_message: str,
        dead_letter: bool,
    ) -> None:
        job_status = "dead_letter" if dead_letter else "failed"
        with psycopg.connect(self.database_url) as connection:
            if version_id is not None:
                connection.execute(
                    """
                    update public.source_versions set processing_status = 'failed', error_code = %s,
                      error_message_sanitized = %s, completed_at = now()
                    where id = %s and processing_status <> 'completed'
                    """,
                    (code, public_message, version_id),
                )
            connection.execute(
                """
                update public.ingestion_jobs set status = %s, error_code = %s,
                  error_message_sanitized = %s, completed_at = now()
                where id = %s
                """,
                (job_status, code, public_message, message.job_id),
            )
            connection.execute(
                "update public.sources set ingestion_status = 'failed' where id = %s",
                (message.source_id,),
            )
