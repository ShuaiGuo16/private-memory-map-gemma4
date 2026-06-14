from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.app.api.deps import get_job_or_404
from backend.app.db.models import AnalysisJob
from backend.app.schemas.job import AnalysisJobRead

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=AnalysisJobRead)
def get_job(
    job: AnalysisJob = Depends(get_job_or_404),
) -> AnalysisJobRead:
    return AnalysisJobRead.model_validate(job)
