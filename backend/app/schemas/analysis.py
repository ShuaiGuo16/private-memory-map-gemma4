from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PhotoAnalysisRead(BaseModel):
    photo_id: int
    scene: str
    activities: list[str]
    objects: list[str]
    mood: str
    memory_prompt: str
    confidence: float = Field(ge=0.0, le=1.0)
    raw_model_json: dict[str, Any]
    scene_summary: str = ""
    memory_caption: str = ""
    place_type: str = ""
    visible_activities: list[str] = Field(default_factory=list)
    visible_objects: list[str] = Field(default_factory=list)
    sensory_details: list[str] = Field(default_factory=list)
    inferred_interest_signals: list[str] = Field(default_factory=list)
    uncertainty_notes: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TripAnalysisResponse(BaseModel):
    trip_id: int
    analyzed_photo_count: int
    analyses: list[PhotoAnalysisRead]


class MemorableMomentRead(BaseModel):
    title: str
    description: str
    evidence_photo_ids: list[int]


class TripMemoryRead(BaseModel):
    trip_id: int
    narrative_summary: str
    inferred_interests: list[str]
    recurring_themes: list[str]
    memorable_moments: list[MemorableMomentRead]
    evidence_photo_ids: list[int]
    uncertainty_notes: list[str]
    raw_model_json: dict[str, Any]
    prompt_version: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
