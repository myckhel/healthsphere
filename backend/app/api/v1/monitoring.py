from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_request_actor
from app.core.config import settings
from app.core.database import get_db
from app.core.monitoring import default_monitoring_service
from app.domain.triage_guardrails import list_triage_red_flag_keywords
from app.schemas.common import RequestActor
from app.schemas.monitoring import (
    AIUsageSummaryResponse,
    GuardrailStatusResponse,
    MonitoringMetricsResponse,
)
from app.services.ai_usage_service import default_ai_usage_service

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


def require_admin_actor(actor: RequestActor) -> RequestActor:
    if actor.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for monitoring routes.",
        )
    return actor


@router.get("/metrics", response_model=MonitoringMetricsResponse)
async def get_monitoring_metrics(
    actor: RequestActor = Depends(get_request_actor),
) -> MonitoringMetricsResponse:
    require_admin_actor(actor)
    return MonitoringMetricsResponse.model_validate(default_monitoring_service.metrics_snapshot())


@router.get("/guardrails", response_model=GuardrailStatusResponse)
async def get_guardrail_status(
    actor: RequestActor = Depends(get_request_actor),
) -> GuardrailStatusResponse:
    require_admin_actor(actor)
    return GuardrailStatusResponse.model_validate(
        {
            "configuration": {
                "clinic_scope_required": True,
                "expensive_endpoint_rate_limit": settings.expensive_endpoint_rate_limit,
                "expensive_endpoint_rate_window_seconds": settings.expensive_endpoint_rate_window_seconds,
                "retrieval_candidate_chunk_limit": settings.retrieval_candidate_chunk_limit,
                "agent_payload_char_budget": settings.agent_payload_char_budget,
                "triage_red_flag_keywords": list_triage_red_flag_keywords(),
            },
            "recent_events": default_monitoring_service.recent_guardrail_events(),
        }
    )


@router.get("/ai-usage", response_model=AIUsageSummaryResponse)
async def get_ai_usage_summary(
    actor_id: str | None = Query(default=None),
    workflow: str | None = Query(default=None),
    clinic_id: uuid.UUID | None = Query(default=None),
    window_hours: int = Query(default=24, ge=1, le=168),
    actor: RequestActor = Depends(get_request_actor),
    db: AsyncSession = Depends(get_db),
) -> AIUsageSummaryResponse:
    require_admin_actor(actor)
    events = await default_ai_usage_service.list_usage_events(
        db,
        clinic_id=clinic_id,
        actor_id=actor_id,
        workflow=workflow,
        window_hours=window_hours,
    )
    return AIUsageSummaryResponse.model_validate(default_ai_usage_service.build_summary(events))
