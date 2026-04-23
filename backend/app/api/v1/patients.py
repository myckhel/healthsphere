from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_request_actor
from app.core.errors import feature_not_ready
from app.schemas.common import RequestActor
from app.schemas.patient import PatientCreateRequest, PatientSummary

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientSummary])
async def list_patients(
    actor: RequestActor = Depends(get_request_actor),
) -> list[PatientSummary]:
    del actor
    return []


@router.post("", response_model=PatientSummary, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> PatientSummary:
    del payload, actor
    raise feature_not_ready("Patient creation workflow")
