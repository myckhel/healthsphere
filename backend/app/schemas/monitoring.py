from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict


class RequestRouteMetric(BaseModel):
    route: str
    request_count: int


class RequestMetricsSnapshot(BaseModel):
    total: int
    by_status: dict[str, int]
    top_routes: list[RequestRouteMetric]
    avg_duration_ms: float
    p95_duration_ms: float
    max_duration_ms: float


class AIWorkflowMetric(BaseModel):
    workflow: str
    run_count: int
    request_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    error_count: int


class AIMonitoringSnapshot(BaseModel):
    by_status: dict[str, int]
    by_workflow: list[AIWorkflowMetric]


class MonitoringMetricsResponse(BaseModel):
    started_at: dt.datetime
    uptime_seconds: float
    requests: RequestMetricsSnapshot
    ai_runs: AIMonitoringSnapshot
    recent_guardrail_event_count: int


class GuardrailConfiguration(BaseModel):
    clinic_scope_required: bool
    expensive_endpoint_rate_limit: int
    expensive_endpoint_rate_window_seconds: int
    retrieval_candidate_chunk_limit: int
    agent_payload_char_budget: int
    triage_red_flag_keywords: list[str]


class GuardrailEventSummary(BaseModel):
    event_type: str
    message: str
    route: str | None
    actor_role: str | None
    clinic_id: str | None
    request_id: str | None
    metadata: dict[str, Any]
    occurred_at: str


class GuardrailStatusResponse(BaseModel):
    configuration: GuardrailConfiguration
    recent_events: list[GuardrailEventSummary]


class AIUsageTotals(BaseModel):
    run_count: int
    request_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class AIUsageActorSummary(BaseModel):
    clinic_id: uuid.UUID | None
    actor_id: str | None
    actor_role: str | None
    run_count: int
    request_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class AIUsageWorkflowSummary(BaseModel):
    workflow: str
    run_count: int
    request_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class AIUsageEventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: dt.datetime
    clinic_id: uuid.UUID | None
    patient_id: uuid.UUID | None
    actor_id: str | None
    actor_role: str | None
    workflow: str
    provider: str
    model: str
    request_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    entity_type: str | None
    entity_id: str | None


class AIUsageSummaryResponse(BaseModel):
    totals: AIUsageTotals
    by_actor: list[AIUsageActorSummary]
    by_workflow: list[AIUsageWorkflowSummary]
    recent_events: list[AIUsageEventSummary]
