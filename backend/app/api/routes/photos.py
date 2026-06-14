from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from backend.app.api.deps import get_photo_or_404, get_trip_or_404
from backend.app.api.serializers import photo_to_read
from backend.app.core.config import get_settings
from backend.app.db.models import Photo, PhotoAnalysis, Trip, utc_now
from backend.app.db.session import get_session
from backend.app.schemas.photo import PhotoRead, PhotoUpdate
from backend.app.services.exif import extract_exif
from backend.app.services.storage import (
    ImageTooLargeError,
    ImageValidationError,
    save_image_upload,
)

router = APIRouter(tags=["photos"])


@router.post("/trips/{trip_id}/photos", response_model=list[PhotoRead])
async def upload_trip_photos(
    files: list[UploadFile] = File(...),
    trip: Trip = Depends(get_trip_or_404),
    session: Session = Depends(get_session),
) -> list[PhotoRead]:
    created: list[Photo] = []
    settings = get_settings()
    trip_id = int(trip.id)
    for upload in files:
        try:
            stored = await save_image_upload(upload, trip_id=trip_id, settings=settings)
        except ImageTooLargeError as exc:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
        except ImageValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        exif = extract_exif(stored.content)
        photo = Photo(
            trip_id=trip_id,
            filename=stored.original_filename,
            stored_path=stored.stored_path,
            captured_at=exif.captured_at,
            latitude=exif.latitude,
            longitude=exif.longitude,
            exif_json=exif.raw,
        )
        session.add(photo)
        created.append(photo)

    session.commit()
    for photo in created:
        session.refresh(photo)
    return [photo_to_read(photo) for photo in created]


@router.get("/trips/{trip_id}/photos", response_model=list[PhotoRead])
def list_trip_photos(
    trip: Trip = Depends(get_trip_or_404),
    session: Session = Depends(get_session),
) -> list[PhotoRead]:
    trip_id = int(trip.id)
    photos = session.exec(
        select(Photo).where(Photo.trip_id == trip_id).order_by(Photo.created_at)
    ).all()
    return [photo_to_read(photo) for photo in photos]


@router.patch("/photos/{photo_id}", response_model=PhotoRead)
def update_photo(
    payload: PhotoUpdate,
    photo: Photo = Depends(get_photo_or_404),
    session: Session = Depends(get_session),
) -> PhotoRead:
    if payload.is_favorite is not None:
        photo.is_favorite = payload.is_favorite

    memory_fields = {
        "user_memory_caption",
        "user_scene_summary",
        "user_mood",
        "user_note",
    }
    if memory_fields.intersection(payload.model_fields_set):
        analysis = session.get(PhotoAnalysis, int(photo.id))
        if analysis is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Analyze this photo before editing memory",
            )
        for field_name in memory_fields.intersection(payload.model_fields_set):
            setattr(analysis, field_name, _clean_optional(getattr(payload, field_name)))
        analysis.updated_at = utc_now()
        session.add(analysis)

    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo_to_read(photo)


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None
