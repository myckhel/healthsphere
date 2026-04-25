from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.clinic_scope import parse_actor_clinic_id, resolve_existing_clinic_scope
from app.api.deps import get_request_actor
from app.core.database import get_db
from app.domain.review_policy import resolve_review_transition
from app.models.audit_event import AuditEvent
from app.models.patient import Patient
from app.models.triage_case import TriageCase
from app.schemas.common import RequestActor
from app.schemas.triage import QueueCaseSummary, TriageCaseCreateRequest, TriageCaseSummary

router = APIRouter(prefix="/triage", tags=["triage"])


@router.get("/cases", response_model=list[TriageCaseSummary])
async def list_triage_cases(
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[TriageCaseSummary]:
    query = select(TriageCase).order_by(TriageCase.created_at.desc())
    clinic_id = parse_actor_clinic_id(actor)
    if clinic_id:
        query = query.where(TriageCase.clinic_id == clinic_id)
    triage_cases = (await db.scalars(query)).all()
    return [TriageCaseSummary.model_validate(item) for item in triage_cases]


@router.get("/queue", response_model=list[QueueCaseSummary])
async def list_queue(
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[QueueCaseSummary]:
    query = (
        select(TriageCase, Patient)
        .outerjoin(Patient, Patient.id == TriageCase.patient_id)
        .where(TriageCase.status == "open")
        .order_by(TriageCase.created_at.asc())
    )
    clinic_id = parse_actor_clinic_id(actor)
    if clinic_id:
        query = query.where(TriageCase.clinic_id == clinic_id)

    rows = (await db.execute(query)).all()
    now = datetime.now(timezone.utc)
    queue_items: list[QueueCaseSummary] = []
    for triage_case, patient in rows:
        patient_name = "Unlinked patient"
        if patient is not None:
            patient_name = f"{patient.first_name} {patient.last_name}".strip()
        wait_minutes = max(int((now - triage_case.created_at).total_seconds() // 60), 0)
        queue_items.append(
            QueueCaseSummary(
                triage_case_id=triage_case.id,
                patient_id=triage_case.patient_id,
                patient_name=patient_name,
                urgency_level=triage_case.urgency_level,
                visit_reason=triage_case.presenting_complaint,
                recommended_queue=triage_case.recommended_queue,
                status=triage_case.status,
                wait_minutes=wait_minutes,
                queued_at=triage_case.created_at.isoformat(),
            )
        )
    return queue_items


@router.post("/cases", response_model=TriageCaseSummary, status_code=status.HTTP_201_CREATED)
async def create_triage_case(
    payload: TriageCaseCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> TriageCaseSummary:
    clinic_id = await resolve_existing_clinic_scope(
        db=db,
        actor=actor,
        requested_clinic_id=payload.clinic_id,
    )
    if payload.patient_id is not None:
        patient_query = select(Patient).where(Patient.id == payload.patient_id)
        if clinic_id:
            patient_query = patient_query.where(Patient.clinic_id == clinic_id)
        patient = await db.scalar(patient_query)
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found for the current clinic scope.",
            )

    reviewed_by, reviewed_at = resolve_review_transition(
        review_status=payload.review_status,
        reviewer_id=actor.subject,
        reviewed_at=datetime.now(timezone.utc),
    )
    triage_case = TriageCase(
        clinic_id=clinic_id,
        patient_id=payload.patient_id,
        source=payload.source,
        status="open",
        urgency_level=payload.urgency_level,
        presenting_complaint=payload.presenting_complaint,
        symptoms=payload.symptoms,
        recommended_queue=payload.recommended_queue,
        recommended_action=payload.recommended_action,
        model_output=payload.model_output,
        review_status=payload.review_status,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
    )
    db.add(triage_case)
    await db.flush()
    db.add(
        AuditEvent(
            clinic_id=triage_case.clinic_id,
            entity_type="triage_case",
            entity_id=str(triage_case.id),
            action="created",
            actor_id=actor.subject,
            actor_role=actor.role,
            details={
                "urgency_level": triage_case.urgency_level,
                "recommended_queue": triage_case.recommended_queue,
                "review_status": triage_case.review_status,
                "reviewed_by": triage_case.reviewed_by,
            },
        )
    )
    await db.commit()
    await db.refresh(triage_case)
    return TriageCaseSummary.model_validate(triage_case)
