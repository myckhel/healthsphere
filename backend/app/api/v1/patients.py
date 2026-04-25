from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.clinic_scope import parse_actor_clinic_id, resolve_existing_clinic_scope
from app.api.deps import get_request_actor
from app.core.database import get_db
from app.models.audit_event import AuditEvent
from app.models.patient import Patient
from app.schemas.common import RequestActor
from app.schemas.patient import PatientCreateRequest, PatientSummary

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientSummary])
async def list_patients(
    q: str | None = Query(default=None),
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[PatientSummary]:
    query = select(Patient).order_by(Patient.created_at.desc())
    clinic_id = parse_actor_clinic_id(actor)
    if clinic_id:
        query = query.where(Patient.clinic_id == clinic_id)
    if q:
        like_term = f"%{q.strip()}%"
        query = query.where(
            Patient.first_name.ilike(like_term)
            | Patient.last_name.ilike(like_term)
            | Patient.external_id.ilike(like_term)
        )
    patients = (await db.scalars(query)).all()
    return [PatientSummary.model_validate(item) for item in patients]


@router.post("", response_model=PatientSummary, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreateRequest,
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> PatientSummary:
    clinic_id = await resolve_existing_clinic_scope(
        db=db,
        actor=actor,
        requested_clinic_id=payload.clinic_id,
    )

    if payload.external_id:
        existing_query = select(Patient).where(Patient.external_id == payload.external_id)
        if clinic_id:
            existing_query = existing_query.where(Patient.clinic_id == clinic_id)
        existing_patient = await db.scalar(existing_query)
        if existing_patient is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Patient external ID already exists in the current clinic scope.",
            )

    patient = Patient(
        clinic_id=clinic_id,
        external_id=payload.external_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        date_of_birth=payload.date_of_birth,
        sex_at_birth=payload.sex_at_birth,
        phone_number=payload.phone_number,
        consent_status=payload.consent_status,
        notes=payload.notes,
    )
    db.add(patient)
    await db.flush()
    db.add(
        AuditEvent(
            clinic_id=patient.clinic_id,
            entity_type="patient",
            entity_id=str(patient.id),
            action="created",
            actor_id=actor.subject,
            actor_role=actor.role,
            details={"consent_status": patient.consent_status},
        )
    )
    await db.commit()
    await db.refresh(patient)
    return PatientSummary.model_validate(patient)
