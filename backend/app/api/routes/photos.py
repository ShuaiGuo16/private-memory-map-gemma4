from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from backend.app.core.config import get_settings
from backend.app.db.models import Photo, Trip
from backend.app.db.session import get_session
from backend.app.schemas.analysis import PhotoAnalysisRead
from backend.app.schemas.photo import PhotoRead
from backend.app.services.exif import extract_exif
from backend.app.services.storage import (
    ImageTooLargeError,
    ImageValidationError,
    save_image_upload,
)

router = APIRouter(tags=["photos"])


@router.post("/trips/{trip_id}/photos", response_model=list[PhotoRead])
async def upload_trip_photos(
    trip_id: int,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
) -> list[PhotoRead]:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    created: list[Photo] = []
    settings = get_settings()
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
    trip_id: int,
    session: Session = Depends(get_session),
) -> list[PhotoRead]:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    photos = session.exec(
        select(Photo).where(Photo.trip_id == trip_id).order_by(Photo.created_at)
    ).all()
    return [photo_to_read(photo) for photo in photos]


def photo_to_read(photo: Photo) -> PhotoRead:
    analysis = (
        PhotoAnalysisRead.model_validate(photo.analysis)
        if photo.analysis is not None
        else None
    )
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
        analysis=analysis,
    )
