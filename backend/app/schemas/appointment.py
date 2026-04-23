from __future__ import annotations

import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class AppointmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    status: str
    scheduled_start_at: dt.datetime
    scheduled_end_at: dt.datetime | None = None
    visit_reason: str
    source: str
    external_reference: str | None = None


class AppointmentCreateRequest(BaseModel):
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    scheduled_start_at: dt.datetime
    scheduled_end_at: dt.datetime | None = None
    visit_reason: str = Field(min_length=1, max_length=2000)
    source: str = Field(default="manual", max_length=32)
    external_reference: str | None = Field(default=None, max_length=128)
