from __future__ import annotations

import os

from pydantic import BaseModel, ConfigDict, Field


class WorkerConfig(BaseModel):
    """Validated worker runtime configuration."""

    model_config = ConfigDict(frozen=True)

    host: str = "127.0.0.1"
    health_port: int = Field(default=8091, ge=1, le=65535)
    ai_provider: str = "mock"

    @classmethod
    def from_environment(cls) -> WorkerConfig:
        return cls.model_validate(
            {
                "host": os.getenv("WORKER_HOST", "127.0.0.1"),
                "health_port": os.getenv("WORKER_HEALTH_PORT", "8091"),
                "ai_provider": os.getenv("AI_PROVIDER", "mock"),
            }
        )
