from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RecordSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    title: str
    record_type: str
    source: str
    review_status: str
    reviewed_by: str | None = None


class RecordDetail(RecordSummary):
    raw_text: str | None = None
    structured_data: dict[str, Any] | None = None
    provenance: dict[str, Any] | None = None
    reviewed_at: dt.datetime | None = None
    created_at: dt.datetime
    updated_at: dt.datetime


class RecordCreateRequest(BaseModel):
    clinic_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    title: str = Field(min_length=1, max_length=255)
    record_type: str = Field(min_length=1, max_length=64)
    source: str = Field(default="manual", max_length=32)
    raw_text: str | None = Field(default=None, max_length=20000)
    structured_data: dict[str, Any] | None = None
    provenance: dict[str, Any] | None = None
    review_status: str = Field(default="pending", max_length=32)


class RecordReviewRequest(BaseModel):
    review_status: str = Field(min_length=1, max_length=32)
