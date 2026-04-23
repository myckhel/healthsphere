from __future__ import annotations

import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class PatientSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID | None = None
    external_id: str | None = None
    first_name: str
    last_name: str
    date_of_birth: dt.date | None = None
    sex_at_birth: str | None = None
    phone_number: str | None = None
    consent_status: str


class PatientCreateRequest(BaseModel):
    clinic_id: uuid.UUID | None = None
    external_id: str | None = Field(default=None, max_length=64)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: dt.date | None = None
    sex_at_birth: str | None = Field(default=None, max_length=32)
    phone_number: str | None = Field(default=None, max_length=32)
    consent_status: str = Field(default="pending", max_length=32)
    notes: str | None = Field(default=None, max_length=2000)
