from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.app.api.deps import get_trip_or_404
from backend.app.api.errors import workflow_bad_request
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
    payload: AskRequest,
    trip: Trip = Depends(get_trip_or_404),
    session: Session = Depends(get_session),
) -> AskResponse:
    try:
        return answer_trip_question_with_gemma(session, int(trip.id), payload.question)
    except WorkflowError as exc:
        raise workflow_bad_request(exc) from exc
