from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Protocol, TypeVar

from pydantic import BaseModel

OutputT = TypeVar("OutputT", bound=BaseModel)


class StructuredModelClient(Protocol):
    def generate(self, output_type: type[OutputT], input_text: str) -> OutputT: ...


class EmbeddingClient(Protocol):
    def embed(self, texts: Sequence[str]) -> list[list[float]]: ...


class MockStructuredModelClient:
    def __init__(self, fixture: dict[str, Any]) -> None:
        self._fixture = fixture

    def generate(
        self,
        output_type: type[OutputT],
        input_text: str = "",
        *,
        prompt: str | None = None,
    ) -> OutputT:
        # ``prompt`` is accepted as the provider-compatible spelling while
        # preserving the original positional test/client API.
        del input_text, prompt
        return output_type.model_validate(self._fixture)


class MockEmbeddingClient:
    def __init__(self, dimensions: int = 8) -> None:
        if dimensions < 1:
            raise ValueError("dimensions must be positive")
        self._dimensions = dimensions

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            vector = [0.0] * self._dimensions
            for index, character in enumerate(text):
                vector[index % self._dimensions] += float(ord(character))
            magnitude = sum(value**2 for value in vector) ** 0.5 or 1.0
            vectors.append([value / magnitude for value in vector])
        return vectors
