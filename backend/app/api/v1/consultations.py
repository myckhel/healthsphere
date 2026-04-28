from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_request_actor
from app.api.clinic_scope import require_actor_clinic_scope, resolve_existing_clinic_scope
from app.api.guardrails import rate_limit_expensive_endpoint
from app.core.database import get_db
from app.core.monitoring import default_monitoring_service
from app.domain import (
    detect_red_flag_reasons,
    discharge_allowed_for_triage,
    is_lab_result_record_type,
)
from app.models.audit_event import AuditEvent
from app.models.consultation_session import ConsultationSession
from app.models.patient import Patient
from app.models.record import Record
from app.models.triage_case import TriageCase
from app.schemas.common import RequestActor
from app.schemas.consultation import (
    ConsultationClinicianReview,
    ConsultationDraftRegenerateRequest,
    ConsultationDraftAssessmentPackage,
    ConsultationLabResultTranslation,
    ConsultationSessionCreateRequest,
    ConsultationSessionDetail,
    ConsultationSessionSummary,
    ConsultationSessionUpdateRequest,
    ConsultationSelectedLabRecord,
)
from app.services import ConsultationSupportService, EmbeddingService, RetrievalService

router = APIRouter(prefix="/consultations", tags=["consultations"])


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()


def get_retrieval_service(
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> RetrievalService:
    return RetrievalService(embedding_service=embedding_service)


def get_consultation_support_service(
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
) -> ConsultationSupportService:
    return ConsultationSupportService(retrieval_service=retrieval_service)


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
    actor_clinic_id = require_actor_clinic_scope(actor)
    if actor_clinic_id:
        query = query.where(ConsultationSession.clinic_id == actor_clinic_id)
    return query


def _extract_clinician_review(draft_note: dict[str, Any] | None) -> ConsultationClinicianReview:
    if not isinstance(draft_note, dict):
        return ConsultationClinicianReview()
    return ConsultationClinicianReview.model_validate(draft_note.get("clinician_review") or {})


def _extract_draft_package(
    draft_note: dict[str, Any] | None,
) -> ConsultationDraftAssessmentPackage | None:
    if not isinstance(draft_note, dict):
        return None
    stored_package = draft_note.get("draft_assessment_package")
    if not isinstance(stored_package, dict):
        return None
    return ConsultationDraftAssessmentPackage.model_validate(stored_package)


def _extract_selected_lab_record(
    draft_note: dict[str, Any] | None,
) -> ConsultationSelectedLabRecord | None:
    if not isinstance(draft_note, dict):
        return None
    stored_record = draft_note.get("selected_lab_record")
    if not isinstance(stored_record, dict):
        return None
    return ConsultationSelectedLabRecord.model_validate(stored_record)


def _extract_translated_lab_result(
    draft_note: dict[str, Any] | None,
) -> ConsultationLabResultTranslation | None:
    if not isinstance(draft_note, dict):
        return None
    stored_translation = draft_note.get("translated_lab_result")
    if not isinstance(stored_translation, dict):
        return None
    return ConsultationLabResultTranslation.model_validate(stored_translation)


def _merge_draft_note(
    existing: dict[str, Any] | None,
    incoming: dict[str, Any] | None,
) -> dict[str, Any]:
    merged = dict(existing or {})
    if incoming:
        merged.update(incoming)
    return merged


def _consultation_note_is_complete(draft_note: dict[str, Any]) -> bool:
    assessment = str(draft_note.get("assessment") or "").strip()
    care_plan = str(draft_note.get("carePlan") or "").strip()
    return bool(assessment and care_plan)


async def _sync_triage_case_status(
    db: AsyncSession,
    *,
    consultation: ConsultationSession,
) -> None:
    if consultation.triage_case_id is None:
        return

    triage_case = consultation.__dict__.get("triage_case")
    if triage_case is None:
        triage_case = await db.scalar(
            select(TriageCase).where(TriageCase.id == consultation.triage_case_id)
        )
    if triage_case is None:
        return

    if consultation.status == "in_progress":
        triage_case.status = "in_consultation"
    elif consultation.status == "completed":
        triage_case.status = "closed"


async def _build_consultation_draft_workspace(
    *,
    db: AsyncSession,
    consultation: ConsultationSession,
    consultation_support_service: ConsultationSupportService,
    actor: RequestActor | None = None,
    request_id: str | None = None,
) -> tuple[
    Patient | None,
    TriageCase | None,
    Any,
    list[Any],
    ConsultationDraftAssessmentPackage | None,
    ConsultationSelectedLabRecord | None,
    ConsultationLabResultTranslation | None,
]:
    patient = consultation.__dict__.get("patient")
    if patient is None:
        patient = await db.scalar(select(Patient).where(Patient.id == consultation.patient_id))

    triage_case = consultation.__dict__.get("triage_case")
    if triage_case is None and consultation.triage_case_id is not None:
        triage_case = await db.scalar(
            select(TriageCase).where(TriageCase.id == consultation.triage_case_id)
        )

    if patient is None:
        return (
            None,
            triage_case,
            None,
            [],
            _extract_draft_package(consultation.draft_note),
            _extract_selected_lab_record(consultation.draft_note),
            _extract_translated_lab_result(consultation.draft_note),
        )

    patient_snapshot, retrieved_context, draft_package, selected_lab_record, translated_lab_result = (
        await consultation_support_service.build_consultation_draft_workspace(
            db,
            consultation=consultation,
            patient=patient,
            triage_case=triage_case,
            existing_draft_note=consultation.draft_note,
            actor_id=actor.subject if actor is not None else None,
            actor_role=actor.role if actor is not None else None,
            request_id=request_id,
        )
    )
    return (
        patient,
        triage_case,
        patient_snapshot,
        retrieved_context,
        draft_package,
        selected_lab_record,
        translated_lab_result,
    )


async def _load_selected_lab_record(
    db: AsyncSession,
    *,
    consultation: ConsultationSession,
    record_id: uuid.UUID,
) -> Record:
    query = select(Record).where(
        Record.id == record_id,
        Record.patient_id == consultation.patient_id,
    )
    if consultation.clinic_id is not None:
        query = query.where(Record.clinic_id == consultation.clinic_id)
    record = await db.scalar(query)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected lab result was not found for the current consultation scope.",
        )
    if not is_lab_result_record_type(record.record_type):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Selected record must be a lab result to use this consultation flow.",
        )
    return record


async def _refresh_consultation_draft_package(
    *,
    db: AsyncSession,
    consultation: ConsultationSession,
    consultation_support_service: ConsultationSupportService,
    actor: RequestActor | None = None,
    request_id: str | None = None,
) -> tuple[
    Any | None,
    list[Any],
    ConsultationDraftAssessmentPackage | None,
    ConsultationSelectedLabRecord | None,
    ConsultationLabResultTranslation | None,
]:
    # Clear cached LLM output so the workspace build always regenerates fresh.
    if isinstance(consultation.draft_note, dict):
        consultation.draft_note = {
            k: v for k, v in consultation.draft_note.items()
            if k not in ("draft_assessment_package", "translated_lab_result")
        }

    _, _, patient_snapshot, retrieved_context, draft_package, selected_lab_record, translated_lab_result = (
        await _build_consultation_draft_workspace(
            db=db,
            consultation=consultation,
            consultation_support_service=consultation_support_service,
            actor=actor,
            request_id=request_id,
        )
    )

    if draft_package is not None:
        consultation.draft_note = _merge_draft_note(
            consultation.draft_note,
            {
                "draft_assessment_package": draft_package.model_dump(mode="json"),
                "selected_lab_record": selected_lab_record.model_dump(mode="json")
                if selected_lab_record
                else None,
                "translated_lab_result": translated_lab_result.model_dump(mode="json")
                if translated_lab_result
                else None,
            },
        )

    return (
        patient_snapshot,
        retrieved_context,
        draft_package,
        selected_lab_record,
        translated_lab_result,
    )


async def _build_consultation_detail(
    *,
    db: AsyncSession,
    consultation: ConsultationSession,
    consultation_support_service: ConsultationSupportService,
    actor: RequestActor | None = None,
    request_id: str | None = None,
    patient_snapshot=None,
    retrieved_context: list[Any] | None = None,
    draft_package: ConsultationDraftAssessmentPackage | None = None,
    selected_lab_record: ConsultationSelectedLabRecord | None = None,
    translated_lab_result: ConsultationLabResultTranslation | None = None,
) -> ConsultationSessionDetail:
    (
        _patient,
        _triage_case,
        built_patient_snapshot,
        built_retrieved_context,
        built_draft_package,
        built_selected_lab_record,
        built_translated_lab_result,
    ) = await _build_consultation_draft_workspace(
        db=db,
        consultation=consultation,
        consultation_support_service=consultation_support_service,
        actor=actor,
        request_id=request_id,
    )

    resolved_patient_snapshot = (
        patient_snapshot if patient_snapshot is not None else built_patient_snapshot
    )
    resolved_retrieved_context = (
        retrieved_context if retrieved_context is not None else built_retrieved_context
    )
    resolved_draft_package = (
        draft_package if draft_package is not None else built_draft_package
    )
    resolved_selected_lab_record = (
        selected_lab_record if selected_lab_record is not None else built_selected_lab_record
    )
    resolved_translated_lab_result = (
        translated_lab_result
        if translated_lab_result is not None
        else built_translated_lab_result
    )

    detail = ConsultationSessionDetail.model_validate(consultation)
    return detail.model_copy(
        update={
            "patient_snapshot": resolved_patient_snapshot,
            "retrieved_context": resolved_retrieved_context,
            "draft_assessment_package": resolved_draft_package,
            "selected_lab_record": resolved_selected_lab_record,
            "translated_lab_result": resolved_translated_lab_result,
            "clinician_review": _extract_clinician_review(consultation.draft_note),
        }
    )


@router.get("", response_model=list[ConsultationSessionSummary])
async def list_consultations(
    patient_id: uuid.UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> list[ConsultationSessionSummary]:
    require_actor_clinic_scope(actor)
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
    request: Request,
    actor: RequestActor = Depends(get_request_actor),
    _rate_limit: None = Depends(rate_limit_expensive_endpoint("consultations_get")),
    consultation_support_service: ConsultationSupportService = Depends(
        get_consultation_support_service
    ),
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
    return await _build_consultation_detail(
        db=db,
        consultation=consultation,
        consultation_support_service=consultation_support_service,
        actor=actor,
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("", response_model=ConsultationSessionDetail, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    payload: ConsultationSessionCreateRequest,
    request: Request,
    actor: RequestActor = Depends(get_request_actor),
    _rate_limit: None = Depends(rate_limit_expensive_endpoint("consultations_create")),
    consultation_support_service: ConsultationSupportService = Depends(
        get_consultation_support_service
    ),
    db: AsyncSession = Depends(get_db),
) -> ConsultationSessionDetail:
    clinic_id = await resolve_existing_clinic_scope(
        db=db,
        actor=actor,
        requested_clinic_id=payload.clinic_id,
    )
    patient = await _load_patient(db, patient_id=payload.patient_id, clinic_id=clinic_id)
    triage_case = None
    if payload.triage_case_id is not None:
        triage_case = await _load_triage_case(
            db,
            triage_case_id=payload.triage_case_id,
            clinic_id=clinic_id,
        )

    consultation = ConsultationSession(
        clinic_id=clinic_id,
        patient_id=payload.patient_id,
        triage_case_id=payload.triage_case_id,
        status=payload.status,
        clinician_id=actor.subject,
        clinician_name=payload.clinician_name,
        draft_note=_merge_draft_note(payload.draft_note, None),
        started_at=datetime.now(timezone.utc) if payload.status == "in_progress" else None,
        completed_at=datetime.now(timezone.utc) if payload.status == "completed" else None,
    )
    if consultation.status == "completed" and not _consultation_note_is_complete(
        consultation.draft_note or {}
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment and care plan are required before completing a consultation.",
        )

    consultation.patient = patient
    consultation.triage_case = triage_case
    patient_snapshot, retrieved_context, draft_package, selected_lab_record, translated_lab_result = (
        await _refresh_consultation_draft_package(
            db=db,
            consultation=consultation,
            consultation_support_service=consultation_support_service,
            actor=actor,
            request_id=getattr(request.state, "request_id", None),
        )
    )
    db.add(consultation)
    await db.flush()
    await _sync_triage_case_status(db, consultation=consultation)
    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=clinic_id,
        consultation_id=consultation.id,
        action="created",
        details={
            "status": consultation.status,
            "retrieved_context_count": len(retrieved_context),
            "draft_assessment_source": draft_package.source,
            "selected_lab_record_id": str(selected_lab_record.record_id)
            if selected_lab_record
            else None,
        },
    )
    await db.commit()
    await db.refresh(consultation)
    return await _build_consultation_detail(
        db=db,
        consultation=consultation,
        consultation_support_service=consultation_support_service,
        actor=actor,
        request_id=getattr(request.state, "request_id", None),
        patient_snapshot=patient_snapshot,
        retrieved_context=retrieved_context,
        draft_package=draft_package,
        selected_lab_record=selected_lab_record,
        translated_lab_result=translated_lab_result,
    )


@router.patch("/{consultation_id}", response_model=ConsultationSessionDetail)
async def update_consultation(
    consultation_id: uuid.UUID,
    payload: ConsultationSessionUpdateRequest,
    request: Request,
    actor: RequestActor = Depends(get_request_actor),
    _rate_limit: None = Depends(rate_limit_expensive_endpoint("consultations_update")),
    consultation_support_service: ConsultationSupportService = Depends(
        get_consultation_support_service
    ),
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
    merged_draft_note = _merge_draft_note(consultation.draft_note, payload.draft_note)
    existing_review = _extract_clinician_review(consultation.draft_note)
    review_finalized = existing_review.is_finalized
    triage_case = consultation.__dict__.get("triage_case")
    if triage_case is None and consultation.triage_case_id is not None:
        triage_case = await db.scalar(
            select(TriageCase).where(TriageCase.id == consultation.triage_case_id)
        )

    if payload.clinician_name is not None:
        consultation.clinician_name = payload.clinician_name
    if payload.next_action is not None:
        consultation.next_action = payload.next_action
    if payload.final_assessment_reviewed is True:
        merged_draft_note["clinician_review"] = ConsultationClinicianReview(
            is_finalized=True,
            reviewed_by=actor.subject,
            reviewed_at=datetime.now(timezone.utc),
        ).model_dump(mode="json")
        review_finalized = True
    elif payload.final_assessment_reviewed is False:
        merged_draft_note["clinician_review"] = ConsultationClinicianReview().model_dump(
            mode="json"
        )
        review_finalized = False
    if payload.selected_lab_record_id is not None:
        selected_record = await _load_selected_lab_record(
            db,
            consultation=consultation,
            record_id=payload.selected_lab_record_id,
        )
        merged_draft_note["selected_lab_record_id"] = str(selected_record.id)

    if payload.status is not None:
        if payload.status == "completed":
            if not review_finalized:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Explicit clinician review is required before completing a consultation.",
                )
            if not _consultation_note_is_complete(merged_draft_note):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assessment and care plan are required before completing a consultation.",
                )
            if payload.next_action is None and consultation.next_action is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A next action is required before completing a consultation.",
                )
            final_next_action = payload.next_action or consultation.next_action
            if final_next_action == "discharge" and triage_case is not None:
                red_flag_reasons = detect_red_flag_reasons(
                    presenting_complaint=triage_case.presenting_complaint,
                    symptoms=triage_case.symptoms,
                )
                if not discharge_allowed_for_triage(
                    urgency_level=triage_case.urgency_level,
                    red_flag_reasons=red_flag_reasons,
                ):
                    default_monitoring_service.record_guardrail_event(
                        event_type="unsafe_discharge_blocked",
                        message="High-risk triage cases cannot be discharged without explicit escalation.",
                        route=f"/api/v1/consultations/{consultation_id}",
                        actor_role=actor.role,
                        clinic_id=str(consultation.clinic_id) if consultation.clinic_id else actor.clinic_id,
                        request_id=getattr(request.state, "request_id", None),
                        metadata={
                            "urgency_level": triage_case.urgency_level,
                            "red_flag_reasons": red_flag_reasons,
                        },
                    )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="High-risk triage cases cannot be discharged without explicit escalation.",
                    )
        consultation.status = payload.status
        if payload.status == "in_progress" and consultation.started_at is None:
            consultation.started_at = datetime.now(timezone.utc)
        if payload.status == "completed":
            if consultation.started_at is None:
                consultation.started_at = datetime.now(timezone.utc)
            consultation.completed_at = datetime.now(timezone.utc)

    consultation.draft_note = merged_draft_note
    await _sync_triage_case_status(db, consultation=consultation)

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
            "final_assessment_reviewed": review_finalized,
            "selected_lab_record_id": merged_draft_note.get("selected_lab_record_id"),
        },
    )
    await db.commit()
    await db.refresh(consultation)
    return await _build_consultation_detail(
        db=db,
        consultation=consultation,
        consultation_support_service=consultation_support_service,
        actor=actor,
        request_id=getattr(request.state, "request_id", None),
    )


@router.post(
    "/{consultation_id}/draft-assessment/regenerate",
    response_model=ConsultationSessionDetail,
)
async def regenerate_consultation_draft_assessment(
    consultation_id: uuid.UUID,
    request: Request,
    payload: ConsultationDraftRegenerateRequest | None = None,
    actor: RequestActor = Depends(get_request_actor),
    _rate_limit: None = Depends(rate_limit_expensive_endpoint("consultations_regenerate")),
    consultation_support_service: ConsultationSupportService = Depends(
        get_consultation_support_service
    ),
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

    if payload and payload.selected_lab_record_id is not None:
        selected_record = await _load_selected_lab_record(
            db,
            consultation=consultation,
            record_id=payload.selected_lab_record_id,
        )
        consultation.draft_note = _merge_draft_note(
            consultation.draft_note,
            {"selected_lab_record_id": str(selected_record.id)},
        )

    patient_snapshot, retrieved_context, draft_package, selected_lab_record, translated_lab_result = (
        await _refresh_consultation_draft_package(
            db=db,
            consultation=consultation,
            consultation_support_service=consultation_support_service,
            actor=actor,
            request_id=getattr(request.state, "request_id", None),
        )
    )
    await _write_audit_event(
        db,
        actor=actor,
        clinic_id=consultation.clinic_id,
        consultation_id=consultation.id,
        action="draft_regenerated",
        details={
            "retrieved_context_count": len(retrieved_context),
            "draft_assessment_source": draft_package.source if draft_package else None,
            "selected_lab_record_id": str(selected_lab_record.record_id)
            if selected_lab_record
            else None,
        },
    )
    await db.commit()
    await db.refresh(consultation)
    return await _build_consultation_detail(
        db=db,
        consultation=consultation,
        consultation_support_service=consultation_support_service,
        actor=actor,
        request_id=getattr(request.state, "request_id", None),
        patient_snapshot=patient_snapshot,
        retrieved_context=retrieved_context,
        draft_package=draft_package,
        selected_lab_record=selected_lab_record,
        translated_lab_result=translated_lab_result,
    )
