from __future__ import annotations

import signal
import threading
from types import FrameType

from loura_ingest_worker.config import WorkerConfig
from loura_ingest_worker.health import create_health_server


def main() -> None:
    config = WorkerConfig.from_environment()
    server = create_health_server(config.host, config.health_port)
    server.timeout = 0.5
    stopping = threading.Event()

    def stop_server(signum: int, frame: FrameType | None) -> None:
        del signum, frame
        stopping.set()

    signal.signal(signal.SIGINT, stop_server)
    signal.signal(signal.SIGTERM, stop_server)
    print(f"Worker health listening on http://{config.host}:{config.health_port}/healthz")
    try:
        while not stopping.is_set():
            server.handle_request()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
