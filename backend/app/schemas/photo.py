from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from backend.app.schemas.analysis import PhotoAnalysisRead


class PhotoRead(BaseModel):
    id: int
    trip_id: int
    filename: str
    stored_path: str
    image_url: str
    captured_at: datetime | None
    latitude: float | None
    longitude: float | None
    exif_json: dict[str, Any]
    created_at: datetime
    analysis: PhotoAnalysisRead | None = None

    model_config = ConfigDict(from_attributes=True)
