from __future__ import annotations

from backend.app.db.models import Photo
from backend.app.schemas.analysis import PhotoAnalysisRead
from backend.app.schemas.photo import PhotoRead


def photo_to_read(photo: Photo) -> PhotoRead:
    return PhotoRead(
        id=int(photo.id),
        trip_id=photo.trip_id,
        filename=photo.filename,
        stored_path=photo.stored_path,
        image_url=f"/uploads/{photo.stored_path}",
        captured_at=photo.captured_at,
        latitude=photo.latitude,
        longitude=photo.longitude,
        exif_json=photo.exif_json,
        created_at=photo.created_at,
        analysis=(
            PhotoAnalysisRead.model_validate(photo.analysis)
            if photo.analysis is not None
            else None
        ),
    )
