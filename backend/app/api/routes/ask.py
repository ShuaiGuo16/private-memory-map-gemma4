from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from backend.app.db.models import Trip
from backend.app.db.session import get_session
from backend.app.schemas.ask import AskRequest, AskResponse
from backend.app.workflows.travel_memory import (
    WorkflowError,
    answer_trip_question_with_gemma,
)

router = APIRouter(prefix="/trips", tags=["ask"])


@router.post("/{trip_id}/ask", response_model=AskResponse)
def ask_trip(
    trip_id: int,
    payload: AskRequest,
    session: Session = Depends(get_session),
) -> AskResponse:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    try:
        return answer_trip_question_with_gemma(session, trip_id, payload.question)
    except WorkflowError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
