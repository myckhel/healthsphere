from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


DraftReviewStatus = Literal["pending", "needs_review"]
SuggestedQueue = Literal["general", "priority", "physician-now", "emergency"]
ConsultationNextActionSuggestion = Literal[
    "follow-up-booking",
    "nurse-handoff",
    "referral",
    "discharge",
]
LabObservationFlag = Literal[
    "normal",
    "high",
    "low",
    "abnormal",
    "critical",
    "unknown",
]


class IntakeAgentOutput(BaseModel):
    normalized_complaint: str = Field(min_length=1, max_length=1000)
    symptom_terms: list[str] = Field(default_factory=list)
    duration_summary: str | None = Field(default=None, max_length=255)
    red_flags: list[str] = Field(default_factory=list)
    intake_notes: str | None = Field(default=None, max_length=2000)
    review_status: DraftReviewStatus = "needs_review"


class TriageAgentOutput(BaseModel):
    draft_summary: str = Field(min_length=1, max_length=2000)
    urgency_rationale: str = Field(min_length=1, max_length=2000)
    suggested_queue: SuggestedQueue | None = None
    suggested_action: str | None = Field(default=None, max_length=2000)
    red_flag_reasons: list[str] = Field(default_factory=list)
    escalate_immediately: bool = False
    review_status: DraftReviewStatus = "needs_review"


class ConsultationAgentOutput(BaseModel):
    subjective: str = Field(min_length=1, max_length=4000)
    assessment: str = Field(min_length=1, max_length=4000)
    plan: str = Field(min_length=1, max_length=4000)
    follow_up_questions: list[str] = Field(default_factory=list)
    next_action_suggestion: ConsultationNextActionSuggestion | None = None
    review_status: DraftReviewStatus = "needs_review"


class LabResultObservationOutput(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)
    unit: str | None = Field(default=None, max_length=64)
    reference_range: str | None = Field(default=None, max_length=128)
    flag: LabObservationFlag | None = None
    interpretation: str | None = Field(default=None, max_length=500)


class LabResultTranslationAgentOutput(BaseModel):
    clinician_summary: str = Field(min_length=1, max_length=4000)
    patient_explanation: str = Field(min_length=1, max_length=4000)
    abnormal_findings: list[str] = Field(default_factory=list)
    recommended_clinician_actions: list[str] = Field(default_factory=list)
    escalation_note: str | None = Field(default=None, max_length=1000)
    key_observations: list[LabResultObservationOutput] = Field(default_factory=list)
    review_status: DraftReviewStatus = "needs_review"


class RecordDigitizationAgentOutput(BaseModel):
    draft_summary: str = Field(min_length=1, max_length=2000)
    structured_data: dict[str, Any] = Field(default_factory=dict)
    extracted_observations: list[str] = Field(default_factory=list)
    record_date_hint: str | None = Field(default=None, max_length=64)
    review_status: DraftReviewStatus = "needs_review"
