from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from backend.app.db.models import AnalysisJob
from backend.app.db.session import get_session
from backend.app.schemas.job import AnalysisJobRead

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=AnalysisJobRead)
def get_job(
    job_id: int,
    session: Session = Depends(get_session),
) -> AnalysisJobRead:
    job = session.get(AnalysisJob, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return AnalysisJobRead.model_validate(job)
