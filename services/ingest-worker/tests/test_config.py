import pytest
from pydantic import ValidationError

from loura_ingest_worker.config import WorkerConfig


def test_defaults_to_mock_provider(monkeypatch) -> None:
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    config = WorkerConfig.from_environment()

    assert config.ai_provider == "mock"
    assert config.health_port == 8091
    assert config.processing_ready is False


def test_rejects_invalid_health_port(monkeypatch) -> None:
    monkeypatch.setenv("WORKER_HEALTH_PORT", "70000")

    with pytest.raises(ValidationError):
        WorkerConfig.from_environment()
