from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import get_request_actor
from app.core.errors import feature_not_ready
from app.schemas.common import RequestActor
from app.schemas.record import RecordCreateRequest, RecordSummary

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=list[RecordSummary])
async def list_records(
    actor: RequestActor = Depends(get_request_actor),
) -> list[RecordSummary]:
    del actor
    return []


@router.post("", response_model=RecordSummary, status_code=status.HTTP_201_CREATED)
async def create_record(
    payload: RecordCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
) -> RecordSummary:
    del payload, actor
    raise feature_not_ready("Structured record ingestion workflow")


@router.post("/upload", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def upload_record(
    file: UploadFile = File(...),
    actor: RequestActor = Depends(get_request_actor),
) -> None:
    del file, actor
    raise feature_not_ready("Record upload workflow")
