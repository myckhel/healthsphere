from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    details: Any | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class RequestActor(BaseModel):
    subject: str = Field(min_length=1)
    role: Literal["patient", "staff", "clinician", "admin"]
    clinic_id: str | None = None
    auth_provider: Literal["stub", "disabled", "clerk"]
