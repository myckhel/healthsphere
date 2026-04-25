from __future__ import annotations

from datetime import datetime, timezone

from app.agents.schemas import (
    ConsultationAgentOutput,
    RecordDigitizationAgentOutput,
    TriageAgentOutput,
)
from app.domain.review_policy import resolve_review_transition
from app.models.consultation_session import ConsultationSession
from app.models.record import Record
from app.models.triage_case import TriageCase


def apply_triage_agent_draft(
    triage_case: TriageCase,
    draft: TriageAgentOutput,
) -> None:
    triage_case.model_output = {
        "agent_name": "triage_support",
        "draft_generated_at": datetime.now(timezone.utc).isoformat(),
        **draft.model_dump(),
    }
    triage_case.review_status = draft.review_status
    triage_case.reviewed_by = None
    triage_case.reviewed_at = None


def apply_consultation_agent_draft(
    consultation: ConsultationSession,
    draft: ConsultationAgentOutput,
) -> None:
    consultation.draft_note = {
        "agent_name": "consultation_support",
        "draft_generated_at": datetime.now(timezone.utc).isoformat(),
        **draft.model_dump(),
    }


def apply_record_digitization_draft(
    record: Record,
    draft: RecordDigitizationAgentOutput,
    *,
    actor_id: str,
) -> None:
    record.structured_data = draft.structured_data
    record.review_status = draft.review_status
    record.reviewed_by, record.reviewed_at = resolve_review_transition(
        review_status=draft.review_status,
        reviewer_id=actor_id,
        reviewed_at=datetime.now(timezone.utc),
    )
    provenance = dict(record.provenance or {})
    provenance["agent_digitization_draft"] = {
        "agent_name": "record_digitization",
        "draft_generated_at": datetime.now(timezone.utc).isoformat(),
        "draft_summary": draft.draft_summary,
        "extracted_observations": draft.extracted_observations,
        "record_date_hint": draft.record_date_hint,
        "review_status": draft.review_status,
    }
    record.provenance = provenance
