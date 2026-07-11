"""Provider boundary for structured AI calls.

The worker depends on this small protocol rather than on a model SDK.  The
default implementation is deterministic and is suitable for local development
and CI.  A future OpenAI adapter can implement the same protocol without
giving the model any database or canonical-write capability.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any, Protocol, TypeVar

import httpx
from pydantic import BaseModel

OutputT = TypeVar("OutputT", bound=BaseModel)


class StructuredAIProvider(Protocol):
    def generate(self, output_type: type[OutputT], *, prompt: str) -> OutputT: ...


class MockAIProvider:
    """Deterministic fixture-backed provider; no network or credentials."""

    def __init__(self, fixture: Mapping[str, Any]) -> None:
        self._fixture = dict(fixture)
        self.calls = 0

    def generate(self, output_type: type[OutputT], *, prompt: str) -> OutputT:
        del prompt
        self.calls += 1
        # Validation is deliberately performed at the provider boundary so
        # malformed model output is rejected before proposal construction.
        return output_type.model_validate(self._fixture)


class MalformedAIOutputError(ValueError):
    """Raised when a provider returns output outside the versioned schema."""


class OpenAIUnavailableError(RuntimeError):
    """Raised when live provider use is not explicitly configured."""


class OpenAIStructuredProvider:
    """Small, opt-in OpenAI-compatible JSON provider.

    The worker keeps this adapter behind configuration and never gives the
    provider database handles or canonical write capabilities. Default local
    and CI operation continues to use :class:`MockAIProvider`.
    """

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        base_url: str = "https://api.openai.com/v1",
        timeout_seconds: float = 60.0,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds

    def generate(self, output_type: type[OutputT], *, prompt: str) -> OutputT:
        if not self._api_key:
            raise OpenAIUnavailableError("live AI is not configured")
        response = httpx.post(
            f"{self._base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={
                "model": self._model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Return only valid JSON matching the requested schema.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=self._timeout,
        )
        response.raise_for_status()
        try:
            content = response.json()["choices"][0]["message"]["content"]
            value = json.loads(content)
            return output_type.model_validate(value)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError, ValueError) as error:
            raise MalformedAIOutputError("provider returned invalid structured output") from error
