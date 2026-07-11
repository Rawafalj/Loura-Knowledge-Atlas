import json
import threading
import urllib.request

from loura_ingest_worker.health import create_health_server


def test_health_endpoint_requires_no_external_services() -> None:
    server = create_health_server("127.0.0.1", 0)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{server.server_port}/healthz", timeout=2
        ) as response:
            assert response.status == 200
            assert json.load(response) == {
                "service": "ingest-worker",
                "status": "ok",
                "milestone": 5,
                "processingConfigured": False,
            }
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
