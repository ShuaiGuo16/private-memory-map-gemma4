from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Protocol, Sequence, TypeVar

import ollama
from pydantic import BaseModel

from backend.app.core.config import Settings, get_settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


@dataclass(frozen=True)
class OllamaModelStatus:
    ollama_available: bool
    model_available: bool
    model_status: str
    model_error: str | None = None


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


def check_ollama_model(settings: Settings | None = None) -> OllamaModelStatus:
    settings = settings or get_settings()
    try:
        response = ollama.list()
    except Exception as exc:
        return OllamaModelStatus(
            ollama_available=False,
            model_available=False,
            model_status="ollama_unavailable",
            model_error=str(exc),
        )

    model_names = _ollama_model_names(response)
    if settings.gemma_model in model_names:
        return OllamaModelStatus(
            ollama_available=True,
            model_available=True,
            model_status="ready",
        )

    return OllamaModelStatus(
        ollama_available=True,
        model_available=False,
        model_status="model_missing",
        model_error=f"Configured model is not installed: {settings.gemma_model}",
    )


def _ollama_model_names(response: Any) -> set[str]:
    if isinstance(response, dict):
        models = response.get("models", [])
    else:
        models = getattr(response, "models", [])

    names: set[str] = set()
    for item in models:
        if isinstance(item, dict):
            name = item.get("model") or item.get("name")
        else:
            name = getattr(item, "model", None) or getattr(item, "name", None)
        if name:
            names.add(str(name))
    return names
