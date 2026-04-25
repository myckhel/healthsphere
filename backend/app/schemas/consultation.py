from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ConsultationStatus = Literal["ready", "in_progress", "completed"]
ConsultationNextAction = Literal[
    "follow-up-booking",
    "nurse-handoff",
    "referral",
    "discharge",
]


class ConsultationPatientSnapshot(BaseModel):
    patient_id: uuid.UUID
    full_name: str
    external_id: str | None = None
    date_of_birth: dt.date | None = None
    sex_at_birth: str | None = None
    phone_number: str | None = None
    consent_status: str
    presenting_complaint: str | None = None
    urgency_level: str | None = None
    recommended_queue: str | None = None
    symptoms: list[str] = Field(default_factory=list)


class ConsultationRetrievedContext(BaseModel):
    record_id: uuid.UUID
    chunk_id: uuid.UUID
    title: str
    record_type: str
    review_status: str
    snippet: str
    similarity_score: float
    recency_score: float
    combined_score: float
    created_at: dt.datetime


class ConsultationDraftAssessmentPackage(BaseModel):
    source: Literal["agent", "fallback"]
    generated_at: dt.datetime
    review_status: str = "needs_review"
    complaint_summary: str
    subjective: str
    assessment: str
    plan: str
    follow_up_questions: list[str] = Field(default_factory=list)
    next_action_suggestion: ConsultationNextAction | None = None


class ConsultationClinicianReview(BaseModel):
    is_finalized: bool = False
    reviewed_by: str | None = None
    reviewed_at: dt.datetime | None = None


class ConsultationSessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    triage_case_id: uuid.UUID | None = None
    status: ConsultationStatus
    clinician_id: str
    clinician_name: str | None = None
    next_action: ConsultationNextAction | None = None
    started_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None


class ConsultationSessionDetail(ConsultationSessionSummary):
    draft_note: dict[str, Any] | None = None
    patient_snapshot: ConsultationPatientSnapshot | None = None
    retrieved_context: list[ConsultationRetrievedContext] = Field(default_factory=list)
    draft_assessment_package: ConsultationDraftAssessmentPackage | None = None
    clinician_review: ConsultationClinicianReview = Field(
        default_factory=ConsultationClinicianReview
    )


class ConsultationSessionCreateRequest(BaseModel):
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    triage_case_id: uuid.UUID | None = None
    clinician_name: str | None = Field(default=None, min_length=1, max_length=255)
    status: ConsultationStatus = "ready"
    draft_note: dict[str, Any] | None = None


class ConsultationSessionUpdateRequest(BaseModel):
    clinician_name: str | None = Field(default=None, min_length=1, max_length=255)
    status: ConsultationStatus | None = None
    next_action: ConsultationNextAction | None = None
    draft_note: dict[str, Any] | None = None
    final_assessment_reviewed: bool | None = None
