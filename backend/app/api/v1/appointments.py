from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_request_actor
from app.core.errors import feature_not_ready
from app.schemas.appointment import AppointmentCreateRequest, AppointmentSummary
from app.schemas.common import RequestActor

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=list[AppointmentSummary])
async def list_appointments(
    actor: RequestActor = Depends(get_request_actor),
) -> list[AppointmentSummary]:
    del actor
    return []


@router.post("", response_model=AppointmentSummary, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> AppointmentSummary:
    del payload, actor
    raise feature_not_ready("Appointment scheduling workflow")
