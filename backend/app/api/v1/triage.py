from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_request_actor
from app.core.errors import feature_not_ready
from app.schemas.common import RequestActor
from app.schemas.triage import TriageCaseCreateRequest, TriageCaseSummary

router = APIRouter(prefix="/triage", tags=["triage"])


@router.get("/cases", response_model=list[TriageCaseSummary])
async def list_triage_cases(
    actor: RequestActor = Depends(get_request_actor),
) -> list[TriageCaseSummary]:
    del actor
    return []


@router.post("/cases", response_model=TriageCaseSummary, status_code=status.HTTP_201_CREATED)
async def create_triage_case(
    payload: TriageCaseCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> TriageCaseSummary:
    del payload, actor
    raise feature_not_ready("Triage intake workflow")
