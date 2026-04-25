from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.clinic_scope import parse_actor_clinic_id, resolve_clinic_scope
from app.api.deps import get_request_actor
from app.core.database import get_db
from app.core.errors import feature_not_ready
from app.domain.review_policy import resolve_record_review_transition
from app.models.audit_event import AuditEvent
from app.models.patient import Patient
from app.models.record import Record
from app.schemas.common import RequestActor
from app.schemas.record import (
    RecordCreateRequest,
    RecordDetail,
    RecordReviewRequest,
    RecordSummary,
)

router = APIRouter(prefix="/records", tags=["records"])


async def _load_patient(
    db: AsyncSession,
    *,
    patient_id: uuid.UUID,
    clinic_id: uuid.UUID | None,
) -> Patient:
    query = select(Patient).where(Patient.id == patient_id)
    if clinic_id:
        query = query.where(Patient.clinic_id == clinic_id)
    patient = await db.scalar(query)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found for the current clinic scope.",
        )
    return patient


async def _load_record(
    db: AsyncSession,
    *,
    record_id: uuid.UUID,
    actor: RequestActor,
) -> Record:
    query = _apply_scope(select(Record).where(Record.id == record_id), actor=actor)
    record = await db.scalar(query)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found for the current clinic scope.",
        )
    return record


async def _write_audit_event(
    db: AsyncSession,
    *,
    actor: RequestActor,
    clinic_id: uuid.UUID | None,
    record_id: uuid.UUID,
    action: str,
    details: dict[str, object] | None = None,
) -> None:
    db.add(
        AuditEvent(
            clinic_id=clinic_id,
            entity_type="record",
            entity_id=str(record_id),
            action=action,
            actor_id=actor.subject,
            actor_role=actor.role,
            details=details,
        )
    )


def _apply_scope(
    query: Select[tuple[Record]],
    *,
    actor: RequestActor,
) -> Select[tuple[Record]]:
    actor_clinic_id = parse_actor_clinic_id(actor)
    if actor_clinic_id:
        query = query.where(Record.clinic_id == actor_clinic_id)
    return query


@router.get("", response_model=list[RecordSummary])
async def list_records(
    patient_id: uuid.UUID | None = Query(default=None),
    review_status: str | None = Query(default=None),
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[RecordSummary]:
    query = _apply_scope(select(Record).order_by(Record.created_at.desc()), actor=actor)
    if patient_id:
        query = query.where(Record.patient_id == patient_id)
    if review_status:
        query = query.where(Record.review_status == review_status)
    records = (await db.scalars(query)).all()
    return [RecordSummary.model_validate(item) for item in records]


@router.get("/{record_id}", response_model=RecordDetail)
async def get_record(
    record_id: uuid.UUID,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> RecordDetail:
    record = await _load_record(db, record_id=record_id, actor=actor)
    return RecordDetail.model_validate(record)


@router.post("", response_model=RecordDetail, status_code=status.HTTP_201_CREATED)
async def create_record(
    payload: RecordCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> RecordDetail:
    clinic_id = resolve_clinic_scope(actor=actor, requested_clinic_id=payload.clinic_id)
    await _load_patient(db, patient_id=payload.patient_id, clinic_id=clinic_id)

    reviewed_by, reviewed_at = resolve_record_review_transition(
        review_status=payload.review_status,
        reviewer_id=actor.subject,
        reviewed_at=datetime.now(timezone.utc),
    )
    record = Record(
        clinic_id=clinic_id,
        patient_id=payload.patient_id,
        title=payload.title,
        record_type=payload.record_type,
        source=payload.source,
        raw_text=payload.raw_text,
        structured_data=payload.structured_data,
        provenance=payload.provenance,
        review_status=payload.review_status,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
    )
    db.add(record)
    await db.flush()
    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=record.clinic_id,
        record_id=record.id,
        action="created",
        details={
            "record_type": record.record_type,
            "review_status": record.review_status,
            "reviewed_by": record.reviewed_by,
        },
    )
    await db.commit()
    await db.refresh(record)
    return RecordDetail.model_validate(record)


@router.patch("/{record_id}/review", response_model=RecordDetail)
async def review_record(
    record_id: uuid.UUID,
    payload: RecordReviewRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> RecordDetail:
    record = await _load_record(db, record_id=record_id, actor=actor)
    before_review_status = record.review_status
    record.review_status = payload.review_status
    record.reviewed_by, record.reviewed_at = resolve_record_review_transition(
        review_status=payload.review_status,
        reviewer_id=actor.subject,
        reviewed_at=datetime.now(timezone.utc),
    )
    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=record.clinic_id,
        record_id=record.id,
        action="reviewed",
        details={
            "before_review_status": before_review_status,
            "after_review_status": record.review_status,
            "reviewed_by": record.reviewed_by,
        },
    )
    await db.commit()
    await db.refresh(record)
    return RecordDetail.model_validate(record)


@router.post("/upload", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def upload_record(
    file: UploadFile = File(...),
    actor: RequestActor = Depends(get_request_actor),
) -> None:
    del file, actor
    raise feature_not_ready("Record upload workflow")
