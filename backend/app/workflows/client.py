from __future__ import annotations

from typing import Any, Mapping, Protocol, Sequence, TypeVar

import ollama
from pydantic import BaseModel

from backend.app.core.config import Settings, get_settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


class GemmaClient(Protocol):
    def complete_json(
        self,
        *,
        messages: Sequence[Mapping[str, Any]],
        schema: type[SchemaT],
        options: Mapping[str, Any],
    ) -> str:
        """Return the model's raw JSON string for the supplied schema."""


class OllamaGemmaClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def complete_json(
        self,
        *,
        messages: Sequence[Mapping[str, Any]],
        schema: type[SchemaT],
        options: Mapping[str, Any],
    ) -> str:
        response = ollama.chat(
            model=self.settings.gemma_model,
            messages=messages,
            format=schema.model_json_schema(),
            options=options,
        )
        message = response["message"] if isinstance(response, dict) else response.message
        content = message["content"] if isinstance(message, dict) else message.content
        if content is None:
            return ""
        return content.strip()
