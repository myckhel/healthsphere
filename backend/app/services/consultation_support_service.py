from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.consultation_scribe import run_consultation_scribe_agent
from app.core.config import settings
from app.models.consultation_session import ConsultationSession
from app.models.patient import Patient
from app.models.record_chunk import RecordChunk
from app.models.triage_case import TriageCase
from app.schemas.consultation import (
    ConsultationDraftAssessmentPackage,
    ConsultationPatientSnapshot,
    ConsultationRetrievedContext,
)
from app.services.retrieval_service import RetrievalService


class ConsultationSupportService:
    def __init__(self, retrieval_service: RetrievalService | None = None) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()

    async def build_consultation_draft_workspace(
        self,
        db: AsyncSession,
        *,
        consultation: ConsultationSession,
        patient: Patient,
        triage_case: TriageCase | None,
        existing_draft_note: dict[str, object] | None,
    ) -> tuple[
        ConsultationPatientSnapshot,
        list[ConsultationRetrievedContext],
        ConsultationDraftAssessmentPackage,
    ]:
        patient_snapshot = await self.build_patient_snapshot(
            patient=patient,
            triage_case=triage_case,
        )
        retrieved_context = await self.build_retrieved_context(
            db,
            clinic_id=consultation.clinic_id,
            patient_id=patient.id,
            query_text=patient_snapshot.presenting_complaint,
        )
        draft_package = await self.build_draft_assessment_package(
            consultation=consultation,
            patient_snapshot=patient_snapshot,
            retrieved_context=retrieved_context,
            existing_draft_note=existing_draft_note,
        )
        return patient_snapshot, retrieved_context, draft_package

    async def build_patient_snapshot(
        self,
        *,
        patient: Patient,
        triage_case: TriageCase | None,
    ) -> ConsultationPatientSnapshot:
        return ConsultationPatientSnapshot(
            patient_id=patient.id,
            full_name=f"{patient.first_name} {patient.last_name}".strip(),
            external_id=patient.external_id,
            date_of_birth=patient.date_of_birth,
            sex_at_birth=patient.sex_at_birth,
            phone_number=patient.phone_number,
            consent_status=patient.consent_status,
            presenting_complaint=triage_case.presenting_complaint if triage_case else None,
            urgency_level=triage_case.urgency_level if triage_case else None,
            recommended_queue=triage_case.recommended_queue if triage_case else None,
            symptoms=list(triage_case.symptoms or []) if triage_case else [],
        )

    async def build_retrieved_context(
        self,
        db: AsyncSession,
        *,
        clinic_id,
        patient_id,
        query_text: str | None,
        limit: int = 3,
    ) -> list[ConsultationRetrievedContext]:
        normalized_query = (query_text or "").strip()
        if not normalized_query:
            return []

        query = select(RecordChunk).where(RecordChunk.patient_id == patient_id)
        if clinic_id is not None:
            query = query.where(RecordChunk.clinic_id == clinic_id)
        chunks = (await db.scalars(query)).all()
        ranked = self.retrieval_service.rank_chunks(
            query=normalized_query,
            chunks=chunks,
            limit=limit,
        )
        return [ConsultationRetrievedContext.model_validate(item) for item in ranked]

    async def build_draft_assessment_package(
        self,
        *,
        consultation: ConsultationSession,
        patient_snapshot: ConsultationPatientSnapshot,
        retrieved_context: list[ConsultationRetrievedContext],
        existing_draft_note: dict[str, object] | None,
    ) -> ConsultationDraftAssessmentPackage:
        complaint_summary = patient_snapshot.presenting_complaint or "Consultation requires clinician review."
        payload = {
            "patient": patient_snapshot.model_dump(mode="json"),
            "records": [item.model_dump(mode="json") for item in retrieved_context],
            "consultation": {
                "consultation_id": str(consultation.id),
                "status": consultation.status,
                "current_draft_note": existing_draft_note or {},
            },
        }

        if settings.openai_api_key:
            try:
                result = await run_consultation_scribe_agent(payload)
                return ConsultationDraftAssessmentPackage(
                    source="agent",
                    generated_at=datetime.now(timezone.utc),
                    review_status=result.get("review_status", "needs_review"),
                    complaint_summary=complaint_summary,
                    subjective=result.get("subjective") or complaint_summary,
                    assessment=result.get("assessment") or "Draft assessment requires clinician confirmation.",
                    plan=result.get("plan") or "Confirm exam findings and document the final care plan.",
                    follow_up_questions=list(result.get("follow_up_questions") or []),
                    next_action_suggestion=result.get("next_action_suggestion"),
                )
            except Exception as e:
                print(f"Error running consultation scribe agent: {e}")
                pass

        return self._build_fallback_package(
            patient_snapshot=patient_snapshot,
            retrieved_context=retrieved_context,
        )

    def _build_fallback_package(
        self,
        *,
        patient_snapshot: ConsultationPatientSnapshot,
        retrieved_context: list[ConsultationRetrievedContext],
    ) -> ConsultationDraftAssessmentPackage:
        complaint_summary = patient_snapshot.presenting_complaint or "Consultation requires clinician review."
        top_context = retrieved_context[0] if retrieved_context else None
        assessment = "Draft assessment for clinician review."
        plan = "Confirm symptoms, review danger signs, and document the clinician-approved next step."
        follow_up_questions = [
            "When did the symptoms begin and how have they changed?",
            "What danger signs or red flags are present today?",
        ]

        if top_context is not None:
            assessment = (
                "Draft assessment for clinician review based on the complaint and prior record context. "
                f"Most relevant record: {top_context.title}."
            )
            plan = (
                "Review the most relevant prior record, confirm current findings, and finalize a clinician-authored plan before discharge or handoff."
            )

        next_action_suggestion = "follow-up-booking"
        normalized_urgency = (patient_snapshot.urgency_level or "").lower()
        if normalized_urgency in {"urgent", "emergency"}:
            next_action_suggestion = "nurse-handoff"

        return ConsultationDraftAssessmentPackage(
            source="fallback",
            generated_at=datetime.now(timezone.utc),
            review_status="needs_review",
            complaint_summary=complaint_summary,
            subjective=complaint_summary,
            assessment=assessment,
            plan=plan,
            follow_up_questions=follow_up_questions,
            next_action_suggestion=next_action_suggestion,
        )