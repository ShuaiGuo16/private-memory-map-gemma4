from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from backend.app.api.deps import get_trip_or_404
from backend.app.api.serializers import photo_to_read
from backend.app.db.models import Photo, Trip, TripMemory
from backend.app.db.session import get_session
from backend.app.schemas.analysis import TripMemoryRead
from backend.app.schemas.trip import TripCreate, TripDetail, TripRead

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, session: Session = Depends(get_session)) -> TripRead:
    trip = Trip(title=payload.title.strip(), description=payload.description)
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return TripRead.model_validate(trip)


@router.get("", response_model=list[TripRead])
def list_trips(session: Session = Depends(get_session)) -> list[TripRead]:
    trips = session.exec(select(Trip).order_by(Trip.created_at.desc())).all()
    return [TripRead.model_validate(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripDetail)
def get_trip(
    trip: Trip = Depends(get_trip_or_404),
    session: Session = Depends(get_session),
) -> TripDetail:
    trip_id = int(trip.id)
    photos = session.exec(
        select(Photo).where(Photo.trip_id == trip_id).order_by(Photo.created_at)
    ).all()
    memory = session.get(TripMemory, trip_id)
    return TripDetail(
        id=int(trip.id),
        title=trip.title,
        description=trip.description,
        created_at=trip.created_at,
        photos=[photo_to_read(photo) for photo in photos],
        memory=TripMemoryRead.model_validate(memory) if memory is not None else None,
    )
