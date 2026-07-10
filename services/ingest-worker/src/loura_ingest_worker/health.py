from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/healthz":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        payload = json.dumps(
            {"service": "ingest-worker", "status": "ok", "milestone": 0}
        ).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        return


def create_health_server(host: str, port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), HealthHandler)

