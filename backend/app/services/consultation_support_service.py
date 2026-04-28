from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.consultation_scribe import run_consultation_scribe_agent
from app.core.ai_usage import AIUsageContext
from app.core.config import settings
from app.models.consultation_session import ConsultationSession
from app.models.patient import Patient
from app.models.record import Record
from app.models.record_chunk import RecordChunk
from app.models.triage_case import TriageCase
from app.schemas.consultation import (
    ConsultationDraftAssessmentPackage,
    ConsultationLabResultTranslation,
    ConsultationPatientSnapshot,
    ConsultationRetrievedContext,
    ConsultationSelectedLabRecord,
)
from app.services.ai_usage_service import AIUsageService
from app.services.lab_result_translation_service import LabResultTranslationService
from app.services.retrieval_service import RetrievalService


class ConsultationSupportService:
    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        lab_result_translation_service: LabResultTranslationService | None = None,
        ai_usage_service: AIUsageService | None = None,
    ) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()
        self.ai_usage_service = ai_usage_service or AIUsageService()
        self.lab_result_translation_service = (
            lab_result_translation_service
            or LabResultTranslationService(ai_usage_service=self.ai_usage_service)
        )

    async def build_consultation_draft_workspace(
        self,
        db: AsyncSession,
        *,
        consultation: ConsultationSession,
        patient: Patient,
        triage_case: TriageCase | None,
        existing_draft_note: dict[str, object] | None,
        actor_id: str | None = None,
        actor_role: str | None = None,
        request_id: str | None = None,
    ) -> tuple[
        ConsultationPatientSnapshot,
        list[ConsultationRetrievedContext],
        ConsultationDraftAssessmentPackage,
        ConsultationSelectedLabRecord | None,
        ConsultationLabResultTranslation | None,
    ]:
        patient_snapshot = await self.build_patient_snapshot(
            patient=patient,
            triage_case=triage_case,
        )
        selected_lab_record, selected_lab_record_model = await self.build_selected_lab_record(
            db,
            consultation=consultation,
            patient_id=patient.id,
        )
        translated_lab_result = await self.build_translated_lab_result(
            db,
            selected_lab_record=selected_lab_record_model,
            consultation=consultation,
            patient=patient,
            actor_id=actor_id,
            actor_role=actor_role,
            request_id=request_id,
        )
        retrieved_context = await self.build_retrieved_context(
            db,
            clinic_id=consultation.clinic_id,
            patient_id=patient.id,
            query_text=patient_snapshot.presenting_complaint,
        )
        draft_package = await self.build_draft_assessment_package(
            db,
            consultation=consultation,
            patient_snapshot=patient_snapshot,
            retrieved_context=retrieved_context,
            selected_lab_record=selected_lab_record,
            translated_lab_result=translated_lab_result,
            existing_draft_note=existing_draft_note,
            actor_id=actor_id,
            actor_role=actor_role,
            request_id=request_id,
        )
        return (
            patient_snapshot,
            retrieved_context,
            draft_package,
            selected_lab_record,
            translated_lab_result,
        )

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

    async def build_selected_lab_record(
        self,
        db: AsyncSession,
        *,
        consultation: ConsultationSession,
        patient_id,
    ) -> tuple[ConsultationSelectedLabRecord | None, Record | None]:
        draft_note = consultation.draft_note or {}
        selected_lab_record_id = draft_note.get("selected_lab_record_id")
        if not selected_lab_record_id:
            return None, None

        query = select(Record).where(
            Record.id == selected_lab_record_id,
            Record.patient_id == patient_id,
        )
        if consultation.clinic_id is not None:
            query = query.where(Record.clinic_id == consultation.clinic_id)
        record = await db.scalar(query)
        if record is None:
            return None, None

        return (
            ConsultationSelectedLabRecord(
                record_id=record.id,
                title=record.title,
                record_type=record.record_type,
                source=record.source,
                review_status=record.review_status,
                created_at=record.created_at,
            ),
            record,
        )

    async def build_translated_lab_result(
        self,
        db: AsyncSession,
        *,
        selected_lab_record: Record | None,
        consultation: ConsultationSession,
        patient: Patient,
        actor_id: str | None,
        actor_role: str | None,
        request_id: str | None,
    ) -> ConsultationLabResultTranslation | None:
        if selected_lab_record is None:
            return None
        return await self.lab_result_translation_service.translate_record(
            db=db,
            record=selected_lab_record,
            usage_context=AIUsageContext(
                workflow="lab_result_translation",
                actor_id=actor_id,
                actor_role=actor_role,
                clinic_id=consultation.clinic_id,
                patient_id=patient.id,
                entity_type="consultation_session",
                entity_id=str(consultation.id) if consultation.id else None,
                request_id=request_id,
            ),
        )

    async def build_draft_assessment_package(
        self,
        db: AsyncSession,
        *,
        consultation: ConsultationSession,
        patient_snapshot: ConsultationPatientSnapshot,
        retrieved_context: list[ConsultationRetrievedContext],
        selected_lab_record: ConsultationSelectedLabRecord | None,
        translated_lab_result: ConsultationLabResultTranslation | None,
        existing_draft_note: dict[str, object] | None,
        actor_id: str | None,
        actor_role: str | None,
        request_id: str | None,
    ) -> ConsultationDraftAssessmentPackage:
        complaint_summary = patient_snapshot.presenting_complaint or "Consultation requires clinician review."
        payload = {
            "patient": patient_snapshot.model_dump(mode="json"),
            "records": [item.model_dump(mode="json") for item in retrieved_context],
            "selected_lab_record": selected_lab_record.model_dump(mode="json")
            if selected_lab_record
            else None,
            "translated_lab_result": translated_lab_result.model_dump(mode="json")
            if translated_lab_result
            else None,
            "consultation": {
                "consultation_id": str(consultation.id),
                "status": consultation.status,
                "current_draft_note": existing_draft_note or {},
            },
        }

        if settings.openai_api_key:
            try:
                usage_context = AIUsageContext(
                    workflow="consultation_support",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    clinic_id=consultation.clinic_id,
                    patient_id=patient_snapshot.patient_id,
                    entity_type="consultation_session",
                    entity_id=str(consultation.id) if consultation.id else None,
                    request_id=request_id,
                )

                async def usage_hook(details):
                    await self.ai_usage_service.record_usage(
                        db,
                        context=usage_context,
                        usage=details,
                        model=settings.openai_model,
                    )

                result = await run_consultation_scribe_agent(
                    payload,
                    usage_hook=usage_hook,
                )
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
            translated_lab_result=translated_lab_result,
        )

    def _build_fallback_package(
        self,
        *,
        patient_snapshot: ConsultationPatientSnapshot,
        retrieved_context: list[ConsultationRetrievedContext],
        translated_lab_result: ConsultationLabResultTranslation | None,
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

        if translated_lab_result is not None:
            assessment = (
                "Draft assessment for clinician review incorporating the selected lab result. "
                f"{translated_lab_result.clinician_summary}"
            )
            plan = (
                "Review the selected lab result directly, correlate it with the current presentation, "
                "and finalize a clinician-authored management plan."
            )
            follow_up_questions.append(
                "Which selected lab findings require repeat testing, treatment follow-up, or escalation today?"
            )

        next_action_suggestion = "follow-up-booking"
        normalized_urgency = (patient_snapshot.urgency_level or "").lower()
        if normalized_urgency in {"urgent", "emergency"}:
            next_action_suggestion = "nurse-handoff"
        elif translated_lab_result and translated_lab_result.escalation_note:
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