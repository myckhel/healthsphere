from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TriageCaseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID | None = None
    source: str
    status: str
    urgency_level: str
    presenting_complaint: str
    recommended_queue: str | None = None
    review_status: str


class QueueCaseSummary(BaseModel):
    triage_case_id: uuid.UUID
    patient_id: uuid.UUID | None = None
    patient_name: str
    urgency_level: str
    visit_reason: str
    recommended_queue: str | None = None
    status: str
    wait_minutes: int
    queued_at: str


class TriageCaseCreateRequest(BaseModel):
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID | None = None
    source: str = Field(default="intake", max_length=32)
    urgency_level: str = Field(default="routine", max_length=32)
    presenting_complaint: str = Field(min_length=1, max_length=2000)
    symptoms: list[str] = Field(default_factory=list)
    recommended_queue: str | None = Field(default=None, max_length=64)
    recommended_action: str | None = Field(default=None, max_length=4000)
    model_output: dict[str, Any] | None = None
    review_status: str = Field(default="pending", max_length=32)
