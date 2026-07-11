from __future__ import annotations

import json
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, cast

from loura_ingest_worker.config import WorkerConfig


class WorkerHealthServer(ThreadingHTTPServer):
    processing_ready: bool
    metrics: WorkerMetrics


@dataclass
class WorkerMetrics:
    polls: int = 0
    claimed: int = 0
    completed: int = 0
    failed: int = 0
    last_error_at: str | None = None


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/healthz":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        payload = json.dumps(
            {
                "service": "ingest-worker",
                "status": "ok",
                "milestone": 9,
                "processingConfigured": cast(WorkerHealthServer, self.server).processing_ready,
                "queue": cast(WorkerHealthServer, self.server).metrics.__dict__,
            }
        ).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        return


def create_health_server(
    host: str, port: int, config: WorkerConfig | None = None
) -> WorkerHealthServer:
    server = WorkerHealthServer((host, port), HealthHandler)
    server.processing_ready = config.processing_ready if config else False
    server.metrics = WorkerMetrics()
    return server
