from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinic import Clinic

DEFAULT_DEV_CLINIC_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
DEFAULT_DEV_CLINIC_NAME = "HealthSphere Demo Clinic"


async def get_clinic(
    db: AsyncSession,
    clinic_id: uuid.UUID,
) -> Clinic | None:
    return await db.scalar(select(Clinic).where(Clinic.id == clinic_id))


async def require_clinic(
    db: AsyncSession,
    clinic_id: uuid.UUID | None,
) -> Clinic | None:
    if clinic_id is None:
        return None

    clinic = await get_clinic(db, clinic_id)
    if clinic is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found for the current clinic scope.",
        )
    return clinic


async def ensure_clinic(
    db: AsyncSession,
    *,
    clinic_id: uuid.UUID,
    name: str,
    country_code: str = "NG",
    timezone: str = "Africa/Lagos",
) -> tuple[Clinic, bool]:
    clinic = await get_clinic(db, clinic_id)
    if clinic is not None:
        return clinic, False

    clinic = Clinic(
        id=clinic_id,
        name=name,
        country_code=country_code,
        timezone=timezone,
        is_active=True,
    )
    db.add(clinic)
    await db.commit()
    await db.refresh(clinic)
    return clinic, True