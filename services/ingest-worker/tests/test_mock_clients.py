from pydantic import BaseModel

from loura_ingest_worker.mock_clients import MockEmbeddingClient, MockStructuredModelClient


class FixtureOutput(BaseModel):
    answer: str


def test_structured_mock_validates_fixture() -> None:
    client = MockStructuredModelClient({"answer": "fixture"})

    assert client.generate(FixtureOutput, "ignored").answer == "fixture"


def test_embedding_mock_is_deterministic() -> None:
    client = MockEmbeddingClient(dimensions=4)

    assert client.embed(["atlas"]) == client.embed(["atlas"])
    assert len(client.embed(["atlas"])[0]) == 4
