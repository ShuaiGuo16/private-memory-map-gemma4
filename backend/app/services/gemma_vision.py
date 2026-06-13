from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from backend.app.core.config import Settings, get_settings
from backend.app.db.models import Photo


@dataclass(frozen=True)
class VisionAnalysis:
    scene: str
    activities: list[str]
    objects: list[str]
    mood: str
    memory_prompt: str
    confidence: float
    raw_model_json: dict[str, Any] = field(default_factory=dict)


class GemmaVisionService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def analyze_photo(self, photo: Photo) -> VisionAnalysis:
        location_hint = (
            f"GPS metadata available at {photo.latitude:.5f}, {photo.longitude:.5f}."
            if photo.latitude is not None and photo.longitude is not None
            else "No GPS metadata was found."
        )
        captured_hint = (
            f"Captured at {photo.captured_at.isoformat()}."
            if photo.captured_at is not None
            else "Capture time was not available."
        )

        return VisionAnalysis(
            scene="Pending Gemma 4 vision analysis",
            activities=[],
            objects=[],
            mood="unknown",
            memory_prompt=(
                "Review this photo with the local vision model and ask what "
                "moment from the trip it should help the traveler remember."
            ),
            confidence=0.0,
            raw_model_json={
                "adapter_status": "stub",
                "model": self.settings.gemma_model,
                "notes": [
                    "This scaffold preserves the analysis contract.",
                    captured_hint,
                    location_hint,
                ],
            },
        )
