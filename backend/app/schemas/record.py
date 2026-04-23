from __future__ import annotations

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
