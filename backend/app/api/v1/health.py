from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
    )


@router.get("/ready", response_model=HealthResponse)
async def ready(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    await db.execute(text("SELECT 1"))
    return HealthResponse(
        status="ready",
        service=settings.app_name,
        version=settings.app_version,
    )
