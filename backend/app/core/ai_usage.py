from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(slots=True)
class AIUsageContext:
    workflow: str
    actor_id: str | None
    actor_role: str | None
    clinic_id: uuid.UUID | None
    patient_id: uuid.UUID | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    request_id: str | None = None


@dataclass(slots=True)
class AIUsageDetails:
    requests: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cached_input_tokens: int = 0
    reasoning_tokens: int = 0
