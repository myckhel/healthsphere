from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_usage import AIUsageContext, AIUsageDetails
from app.core.config import settings
from app.core.monitoring import default_monitoring_service
from app.models.ai_usage_event import AIUsageEvent


class AIUsageService:
    def estimate_cost_usd(self, usage: AIUsageDetails) -> float:
        cached_input_tokens = min(usage.cached_input_tokens, usage.input_tokens)
        uncached_input_tokens = max(usage.input_tokens - cached_input_tokens, 0)
        cached_input_rate = (
            settings.openai_cached_input_cost_per_million_tokens_usd
            if settings.openai_cached_input_cost_per_million_tokens_usd is not None
            else settings.openai_input_cost_per_million_tokens_usd
        )
        estimated_cost = (
            (uncached_input_tokens * settings.openai_input_cost_per_million_tokens_usd)
            + (cached_input_tokens * cached_input_rate)
            + (usage.output_tokens * settings.openai_output_cost_per_million_tokens_usd)
        ) / 1000000
        return round(estimated_cost, 6)

    async def record_usage(
        self,
        db: AsyncSession,
        *,
        context: AIUsageContext,
        usage: AIUsageDetails,
        model: str,
        provider: str = "openai",
    ) -> None:
        estimated_cost_usd = self.estimate_cost_usd(usage)
        db.add(
            AIUsageEvent(
                clinic_id=context.clinic_id,
                patient_id=context.patient_id,
                entity_type=context.entity_type,
                entity_id=context.entity_id,
                actor_id=context.actor_id,
                actor_role=context.actor_role,
                workflow=context.workflow,
                provider=provider,
                model=model,
                request_count=usage.requests,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                total_tokens=usage.total_tokens,
                cached_input_tokens=usage.cached_input_tokens,
                reasoning_tokens=usage.reasoning_tokens,
                estimated_cost_usd=estimated_cost_usd,
            )
        )
        default_monitoring_service.record_ai_run(
            workflow=context.workflow,
            status="completed",
            request_count=usage.requests,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
            estimated_cost_usd=estimated_cost_usd,
        )

    async def list_usage_events(
        self,
        db: AsyncSession,
        *,
        clinic_id: uuid.UUID | None = None,
        actor_id: str | None = None,
        workflow: str | None = None,
        window_hours: int = 24,
        limit: int = 200,
    ) -> list[AIUsageEvent]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
        query = select(AIUsageEvent).where(AIUsageEvent.created_at >= cutoff)
        if clinic_id is not None:
            query = query.where(AIUsageEvent.clinic_id == clinic_id)
        if actor_id is not None:
            query = query.where(AIUsageEvent.actor_id == actor_id)
        if workflow is not None:
            query = query.where(AIUsageEvent.workflow == workflow)
        query = query.order_by(AIUsageEvent.created_at.desc()).limit(limit)
        return list((await db.scalars(query)).all())

    def build_summary(self, events: list[AIUsageEvent]) -> dict[str, Any]:
        totals = {
            "run_count": 0,
            "request_count": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "estimated_cost_usd": 0.0,
        }
        by_actor: dict[tuple[str | None, str | None, str | None], dict[str, Any]] = {}
        by_workflow: dict[str, dict[str, Any]] = {}
        recent_events: list[dict[str, Any]] = []

        for event in events:
            totals["run_count"] += 1
            totals["request_count"] += event.request_count
            totals["input_tokens"] += event.input_tokens
            totals["output_tokens"] += event.output_tokens
            totals["total_tokens"] += event.total_tokens
            totals["estimated_cost_usd"] += float(event.estimated_cost_usd)

            actor_key = (
                event.actor_id,
                event.actor_role,
                str(event.clinic_id) if event.clinic_id is not None else None,
            )
            actor_summary = by_actor.setdefault(
                actor_key,
                {
                    "actor_id": event.actor_id,
                    "actor_role": event.actor_role,
                    "clinic_id": event.clinic_id,
                    "run_count": 0,
                    "request_count": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "estimated_cost_usd": 0.0,
                },
            )
            actor_summary["run_count"] += 1
            actor_summary["request_count"] += event.request_count
            actor_summary["input_tokens"] += event.input_tokens
            actor_summary["output_tokens"] += event.output_tokens
            actor_summary["total_tokens"] += event.total_tokens
            actor_summary["estimated_cost_usd"] += float(event.estimated_cost_usd)

            workflow_summary = by_workflow.setdefault(
                event.workflow,
                {
                    "workflow": event.workflow,
                    "run_count": 0,
                    "request_count": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "estimated_cost_usd": 0.0,
                },
            )
            workflow_summary["run_count"] += 1
            workflow_summary["request_count"] += event.request_count
            workflow_summary["input_tokens"] += event.input_tokens
            workflow_summary["output_tokens"] += event.output_tokens
            workflow_summary["total_tokens"] += event.total_tokens
            workflow_summary["estimated_cost_usd"] += float(event.estimated_cost_usd)

            recent_events.append(
                {
                    "id": event.id,
                    "created_at": event.created_at,
                    "actor_id": event.actor_id,
                    "actor_role": event.actor_role,
                    "clinic_id": event.clinic_id,
                    "patient_id": event.patient_id,
                    "workflow": event.workflow,
                    "provider": event.provider,
                    "model": event.model,
                    "request_count": event.request_count,
                    "input_tokens": event.input_tokens,
                    "output_tokens": event.output_tokens,
                    "total_tokens": event.total_tokens,
                    "estimated_cost_usd": float(event.estimated_cost_usd),
                    "entity_type": event.entity_type,
                    "entity_id": event.entity_id,
                }
            )

        totals["estimated_cost_usd"] = round(float(totals["estimated_cost_usd"]), 6)
        return {
            "totals": totals,
            "by_actor": [
                {
                    **summary,
                    "estimated_cost_usd": round(float(summary["estimated_cost_usd"]), 6),
                }
                for summary in sorted(
                    by_actor.values(),
                    key=lambda item: (-item["estimated_cost_usd"], item["actor_id"] or ""),
                )
            ],
            "by_workflow": [
                {
                    **summary,
                    "estimated_cost_usd": round(float(summary["estimated_cost_usd"]), 6),
                }
                for summary in sorted(
                    by_workflow.values(),
                    key=lambda item: (-item["estimated_cost_usd"], item["workflow"]),
                )
            ],
            "recent_events": recent_events,
        }


default_ai_usage_service = AIUsageService()
