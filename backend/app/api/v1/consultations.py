from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_request_actor
from app.api.clinic_scope import parse_actor_clinic_id, resolve_existing_clinic_scope
from app.core.database import get_db
from app.models.audit_event import AuditEvent
from app.models.consultation_session import ConsultationSession
from app.models.patient import Patient
from app.models.triage_case import TriageCase
from app.schemas.common import RequestActor
from app.schemas.consultation import (
    ConsultationSessionCreateRequest,
    ConsultationSessionDetail,
    ConsultationSessionSummary,
    ConsultationSessionUpdateRequest,
)

router = APIRouter(prefix="/consultations", tags=["consultations"])


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


async def _load_triage_case(
    db: AsyncSession,
    *,
    triage_case_id: uuid.UUID,
    clinic_id: uuid.UUID | None,
) -> TriageCase:
    query = select(TriageCase).where(TriageCase.id == triage_case_id)
    if clinic_id:
        query = query.where(TriageCase.clinic_id == clinic_id)
    triage_case = await db.scalar(query)
    if triage_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Triage case not found for the current clinic scope.",
        )
    return triage_case


async def _write_audit_event(
    db: AsyncSession,
    *,
    actor: RequestActor,
    clinic_id: uuid.UUID | None,
    consultation_id: uuid.UUID,
    action: str,
    details: dict[str, object] | None = None,
) -> None:
    db.add(
        AuditEvent(
            clinic_id=clinic_id,
            entity_type="consultation_session",
            entity_id=str(consultation_id),
            action=action,
            actor_id=actor.subject,
            actor_role=actor.role,
            details=details,
        )
    )


def _apply_scope(
    query: Select[tuple[ConsultationSession]],
    *,
    actor: RequestActor,
) -> Select[tuple[ConsultationSession]]:
    actor_clinic_id = parse_actor_clinic_id(actor)
    if actor_clinic_id:
        query = query.where(ConsultationSession.clinic_id == actor_clinic_id)
    return query


@router.get("", response_model=list[ConsultationSessionSummary])
async def list_consultations(
    patient_id: uuid.UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[ConsultationSessionSummary]:
    query = _apply_scope(select(ConsultationSession).order_by(ConsultationSession.created_at.desc()), actor=actor)
    if patient_id:
        query = query.where(ConsultationSession.patient_id == patient_id)
    if status_filter:
        query = query.where(ConsultationSession.status == status_filter)
    consultations = (await db.scalars(query)).all()
    return [ConsultationSessionSummary.model_validate(item) for item in consultations]


@router.get("/{consultation_id}", response_model=ConsultationSessionDetail)
async def get_consultation(
    consultation_id: uuid.UUID,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> ConsultationSessionDetail:
    query = _apply_scope(
        select(ConsultationSession).where(ConsultationSession.id == consultation_id),
        actor=actor,
    )
    consultation = await db.scalar(query)
    if consultation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found for the current clinic scope.",
        )
    return ConsultationSessionDetail.model_validate(consultation)


@router.post("", response_model=ConsultationSessionDetail, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    payload: ConsultationSessionCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> ConsultationSessionDetail:
    clinic_id = await resolve_existing_clinic_scope(
        db=db,
        actor=actor,
        requested_clinic_id=payload.clinic_id,
    )
    await _load_patient(db, patient_id=payload.patient_id, clinic_id=clinic_id)
    if payload.triage_case_id is not None:
        await _load_triage_case(db, triage_case_id=payload.triage_case_id, clinic_id=clinic_id)

    consultation = ConsultationSession(
        clinic_id=clinic_id,
        patient_id=payload.patient_id,
        triage_case_id=payload.triage_case_id,
        status=payload.status,
        clinician_id=actor.subject,
        clinician_name=payload.clinician_name,
        draft_note=payload.draft_note,
        started_at=datetime.now(timezone.utc) if payload.status == "in_progress" else None,
        completed_at=datetime.now(timezone.utc) if payload.status == "completed" else None,
    )
    db.add(consultation)
    await db.flush()
    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=clinic_id,
        consultation_id=consultation.id,
        action="created",
        details={"status": consultation.status},
    )
    await db.commit()
    await db.refresh(consultation)
    return ConsultationSessionDetail.model_validate(consultation)


@router.patch("/{consultation_id}", response_model=ConsultationSessionDetail)
async def update_consultation(
    consultation_id: uuid.UUID,
    payload: ConsultationSessionUpdateRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> ConsultationSessionDetail:
    query = _apply_scope(
        select(ConsultationSession).where(ConsultationSession.id == consultation_id),
        actor=actor,
    )
    consultation = await db.scalar(query)
    if consultation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found for the current clinic scope.",
        )

    before_status = consultation.status
    if payload.clinician_name is not None:
        consultation.clinician_name = payload.clinician_name
    if payload.next_action is not None:
        consultation.next_action = payload.next_action
    if payload.draft_note is not None:
        consultation.draft_note = payload.draft_note
    if payload.status is not None:
        consultation.status = payload.status
        if payload.status == "in_progress" and consultation.started_at is None:
            consultation.started_at = datetime.now(timezone.utc)
        if payload.status == "completed":
            if consultation.started_at is None:
                consultation.started_at = datetime.now(timezone.utc)
            consultation.completed_at = datetime.now(timezone.utc)

    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=consultation.clinic_id,
        consultation_id=consultation.id,
        action="updated",
        details={
            "before_status": before_status,
            "after_status": consultation.status,
            "next_action": consultation.next_action,
        },
    )
    await db.commit()
    await db.refresh(consultation)
    return ConsultationSessionDetail.model_validate(consultation)
