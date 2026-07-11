from __future__ import annotations

from typing import Any

import psycopg
from psycopg.rows import dict_row

from loura_ingest_worker.models import ClaimedMessage, QueueMessage


class PgmqConsumer:
    def __init__(self, database_url: str, queue_name: str, visibility_seconds: int) -> None:
        self.database_url = database_url
        self.queue_name = queue_name
        self.visibility_seconds = visibility_seconds

    def read_one(self) -> ClaimedMessage | None:
        with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
            row = connection.execute(
                "select * from pgmq.read(%s, %s, 1)",
                (self.queue_name, self.visibility_seconds),
            ).fetchone()
        if row is None:
            return None
        payload_value: Any = row["message"]
        return ClaimedMessage(
            message_id=int(row["msg_id"]),
            read_count=int(row["read_ct"]),
            enqueued_at=row["enqueued_at"],
            payload=QueueMessage.model_validate(payload_value),
        )

    def archive(self, message_id: int) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                "select pgmq.archive(%s, %s)",
                (self.queue_name, message_id),
            )
