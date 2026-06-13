from __future__ import annotations

from fastapi import APIRouter

from backend.app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def get_health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "gemma_model": settings.gemma_model,
        "database": settings.database_kind,
        "storage": "local",
    }
