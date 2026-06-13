from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.analysis import TripMemoryRead
from backend.app.schemas.photo import PhotoRead


class TripCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)


class TripRead(BaseModel):
    id: int
    title: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripDetail(TripRead):
    photos: list[PhotoRead] = Field(default_factory=list)
    memory: TripMemoryRead | None = None
