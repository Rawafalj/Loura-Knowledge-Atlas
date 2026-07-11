from __future__ import annotations

import os

from pydantic import BaseModel, ConfigDict, Field


class WorkerConfig(BaseModel):
    """Validated worker runtime configuration."""

    model_config = ConfigDict(frozen=True)

    host: str = "127.0.0.1"
    health_port: int = Field(default=8091, ge=1, le=65535)
    ai_provider: str = "mock"
    process_jobs: bool = False
    database_url: str | None = None
    supabase_url: str | None = None
    service_role_key: str | None = None
    queue_name: str = "source_ingest"
    queue_poll_seconds: float = Field(default=1.0, ge=0.1, le=60)
    queue_visibility_seconds: int = Field(default=300, ge=30, le=3600)
    max_attempts: int = Field(default=3, ge=1, le=10)
    parser_profile: str = "default-v1"
    source_max_bytes: int = Field(default=50 * 1024 * 1024, ge=1)
    url_max_bytes: int = Field(default=20 * 1024 * 1024, ge=1)
    url_max_redirects: int = Field(default=4, ge=0, le=10)

    @property
    def processing_ready(self) -> bool:
        return bool(
            self.process_jobs and self.database_url and self.supabase_url and self.service_role_key
        )

    @classmethod
    def from_environment(cls) -> WorkerConfig:
        return cls.model_validate(
            {
                "host": os.getenv("WORKER_HOST", "127.0.0.1"),
                "health_port": os.getenv("WORKER_HEALTH_PORT", "8091"),
                "ai_provider": os.getenv("AI_PROVIDER", "mock"),
                "process_jobs": os.getenv("WORKER_PROCESS_JOBS", "false"),
                "database_url": os.getenv("DATABASE_URL"),
                "supabase_url": os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
                "service_role_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
                "queue_name": os.getenv("SOURCE_INGEST_QUEUE", "source_ingest"),
                "queue_poll_seconds": os.getenv("WORKER_QUEUE_POLL_SECONDS", "1"),
                "queue_visibility_seconds": os.getenv("WORKER_QUEUE_VISIBILITY_SECONDS", "300"),
                "max_attempts": os.getenv("WORKER_MAX_ATTEMPTS", "3"),
                "parser_profile": os.getenv("SOURCE_PARSER_PROFILE", "default-v1"),
                "source_max_bytes": int(os.getenv("SOURCE_MAX_UPLOAD_MB", "50")) * 1024 * 1024,
                "url_max_bytes": int(os.getenv("URL_INGEST_MAX_MB", "20")) * 1024 * 1024,
                "url_max_redirects": os.getenv("URL_INGEST_MAX_REDIRECTS", "4"),
            }
        )
