from __future__ import annotations

from collections.abc import Callable

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import Session, select

from backend.app.core.config import get_settings
from backend.app.db.models import AnalysisJob, Photo, Trip, utc_now
from backend.app.db.session import get_engine, get_session
from backend.app.schemas.analysis import PhotoAnalysisRead
from backend.app.schemas.job import AnalysisJobRead
from backend.app.workflows.client import GemmaClient, OllamaGemmaClient
from backend.app.workflows.travel_memory import (
    WorkflowError,
    analyze_photo_memory,
    run_trip_memory_workflow,
)

router = APIRouter(tags=["analysis"])

ClientFactory = Callable[[], GemmaClient]


def get_gemma_client() -> GemmaClient:
    return OllamaGemmaClient(get_settings())


@router.post("/photos/{photo_id}/analyze", response_model=PhotoAnalysisRead)
def analyze_photo(
    photo_id: int,
    session: Session = Depends(get_session),
) -> PhotoAnalysisRead:
    try:
        record = analyze_photo_memory(session, photo_id, client=get_gemma_client())
    except WorkflowError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return PhotoAnalysisRead.model_validate(record)


@router.post(
    "/trips/{trip_id}/analyze",
    response_model=AnalysisJobRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def analyze_trip(
    trip_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> AnalysisJobRead:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    photos = session.exec(select(Photo).where(Photo.trip_id == trip_id)).all()
    total_steps = len(photos) + (1 if photos else 0)
    job = AnalysisJob(
        trip_id=trip_id,
        status="queued",
        current_step="Queued",
        completed_steps=0,
        total_steps=total_steps,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    background_tasks.add_task(run_analysis_job, int(job.id), get_gemma_client)
    return AnalysisJobRead.model_validate(job)


def run_analysis_job(
    job_id: int,
    client_factory: ClientFactory = get_gemma_client,
) -> None:
    with Session(get_engine()) as session:
        job = session.get(AnalysisJob, job_id)
        if job is None:
            return

        try:
            client = client_factory()

            def update_progress(
                current_step: str,
                completed_steps: int,
                total_steps: int,
            ) -> None:
                _update_job(
                    session,
                    job_id,
                    status_value="running",
                    current_step=current_step,
                    completed_steps=completed_steps,
                    total_steps=total_steps,
                )

            _update_job(
                session,
                job_id,
                status_value="running",
                current_step="Starting analysis",
            )
            run_trip_memory_workflow(
                session,
                job.trip_id,
                client=client,
                on_progress=update_progress,
            )
            final_job = session.get(AnalysisJob, job_id)
            final_total = final_job.total_steps if final_job is not None else 0
            _update_job(
                session,
                job_id,
                status_value="completed",
                current_step="Completed",
                completed_steps=final_total,
                total_steps=final_total,
                error=None,
            )
        except Exception as exc:
            session.rollback()
            _update_job(
                session,
                job_id,
                status_value="failed",
                current_step="Failed",
                error=str(exc),
            )


def _update_job(
    session: Session,
    job_id: int,
    *,
    status_value: str,
    current_step: str | None = None,
    completed_steps: int | None = None,
    total_steps: int | None = None,
    error: str | None = None,
) -> None:
    job = session.get(AnalysisJob, job_id)
    if job is None:
        return

    job.status = status_value
    if current_step is not None:
        job.current_step = current_step
    if completed_steps is not None:
        job.completed_steps = completed_steps
    if total_steps is not None:
        job.total_steps = total_steps
    job.error = error
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
