from __future__ import annotations

import signal
import threading
from datetime import UTC, datetime
from types import FrameType

from loura_ingest_worker.config import WorkerConfig
from loura_ingest_worker.health import create_health_server
from loura_ingest_worker.pipeline import build_pipeline
from loura_ingest_worker.queue import PgmqConsumer


def main() -> None:
    config = WorkerConfig.from_environment()
    server = create_health_server(config.host, config.health_port, config)
    stopping = threading.Event()
    health_thread = threading.Thread(
        target=server.serve_forever,
        kwargs={"poll_interval": 0.5},
        name="worker-health",
        daemon=True,
    )

    def stop_server(signum: int, frame: FrameType | None) -> None:
        del signum, frame
        stopping.set()

    signal.signal(signal.SIGINT, stop_server)
    signal.signal(signal.SIGTERM, stop_server)
    health_thread.start()
    print(f"Worker health listening on http://{config.host}:{config.health_port}/healthz")
    try:
        if not config.processing_ready:
            print("Source ingestion polling disabled; health-only mode is ready")
            stopping.wait()
            return
        if not config.database_url:
            raise RuntimeError("database URL is required when source ingestion polling is enabled")
        consumer = PgmqConsumer(
            config.database_url,
            config.queue_name,
            config.queue_visibility_seconds,
        )
        pipeline = build_pipeline(config)
        print(f"Polling durable queue {config.queue_name}")
        while not stopping.is_set():
            try:
                claimed = consumer.read_one()
                server.metrics.polls += 1
                if claimed is None:
                    stopping.wait(config.queue_poll_seconds)
                    continue
                server.metrics.claimed += 1
                if pipeline.process(claimed):
                    consumer.archive(claimed.message_id)
                    server.metrics.completed += 1
            except Exception:
                # Never emit raw database, source, parser, or credential-bearing errors.
                print("Source ingestion iteration failed; the durable message remains retryable")
                server.metrics.failed += 1
                server.metrics.last_error_at = datetime.now(UTC).isoformat()
                stopping.wait(config.queue_poll_seconds)
    finally:
        server.shutdown()
        server.server_close()
        health_thread.join(timeout=2)


if __name__ == "__main__":
    main()
