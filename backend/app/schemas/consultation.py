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
