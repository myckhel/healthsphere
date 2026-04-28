from __future__ import annotations

import time
from collections import Counter, deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


@dataclass(slots=True)
class GuardrailEvent:
    event_type: str
    message: str
    route: str | None
    actor_role: str | None
    clinic_id: str | None
    request_id: str | None
    metadata: dict[str, Any]
    occurred_at: str


class MonitoringService:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self._started_at_monotonic = time.monotonic()
        self._started_at_utc = datetime.now(timezone.utc)
        self._request_count = 0
        self._request_status_counts: Counter[str] = Counter()
        self._request_path_counts: Counter[str] = Counter()
        self._request_duration_ms: deque[float] = deque(
            maxlen=settings.monitoring_request_duration_window,
        )
        self._guardrail_events: deque[GuardrailEvent] = deque(
            maxlen=settings.monitoring_guardrail_event_limit,
        )
        self._ai_run_counts: Counter[str] = Counter()
        self._ai_workflow_totals: dict[str, dict[str, float | int]] = {}

    def record_request(
        self,
        *,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
    ) -> None:
        self._request_count += 1
        self._request_status_counts[str(status_code)] += 1
        self._request_path_counts[f"{method.upper()} {path}"] += 1
        self._request_duration_ms.append(duration_ms)

    def record_guardrail_event(
        self,
        *,
        event_type: str,
        message: str,
        route: str | None = None,
        actor_role: str | None = None,
        clinic_id: str | None = None,
        request_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._guardrail_events.appendleft(
            GuardrailEvent(
                event_type=event_type,
                message=message,
                route=route,
                actor_role=actor_role,
                clinic_id=clinic_id,
                request_id=request_id,
                metadata=metadata or {},
                occurred_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    def record_ai_run(
        self,
        *,
        workflow: str,
        status: str,
        request_count: int,
        input_tokens: int,
        output_tokens: int,
        total_tokens: int,
        estimated_cost_usd: float,
    ) -> None:
        self._ai_run_counts[status] += 1
        workflow_totals = self._ai_workflow_totals.setdefault(
            workflow,
            {
                "run_count": 0,
                "request_count": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "estimated_cost_usd": 0.0,
                "error_count": 0,
            },
        )
        workflow_totals["run_count"] += 1
        workflow_totals["request_count"] += request_count
        workflow_totals["input_tokens"] += input_tokens
        workflow_totals["output_tokens"] += output_tokens
        workflow_totals["total_tokens"] += total_tokens
        workflow_totals["estimated_cost_usd"] += estimated_cost_usd
        if status != "completed":
            workflow_totals["error_count"] += 1

    def metrics_snapshot(self) -> dict[str, Any]:
        durations = sorted(self._request_duration_ms)
        p95_duration = 0.0
        if durations:
            percentile_index = min(int(round((len(durations) - 1) * 0.95)), len(durations) - 1)
            p95_duration = durations[percentile_index]

        top_paths = [
            {"route": route, "request_count": count}
            for route, count in self._request_path_counts.most_common(10)
        ]
        ai_workflows = [
            {
                "workflow": workflow,
                "run_count": int(values["run_count"]),
                "request_count": int(values["request_count"]),
                "input_tokens": int(values["input_tokens"]),
                "output_tokens": int(values["output_tokens"]),
                "total_tokens": int(values["total_tokens"]),
                "estimated_cost_usd": round(float(values["estimated_cost_usd"]), 6),
                "error_count": int(values["error_count"]),
            }
            for workflow, values in sorted(self._ai_workflow_totals.items())
        ]
        return {
            "started_at": self._started_at_utc,
            "uptime_seconds": round(time.monotonic() - self._started_at_monotonic, 2),
            "requests": {
                "total": self._request_count,
                "by_status": dict(self._request_status_counts),
                "top_routes": top_paths,
                "avg_duration_ms": round(
                    sum(self._request_duration_ms) / len(self._request_duration_ms),
                    2,
                )
                if self._request_duration_ms
                else 0.0,
                "p95_duration_ms": round(p95_duration, 2),
                "max_duration_ms": round(max(self._request_duration_ms), 2)
                if self._request_duration_ms
                else 0.0,
            },
            "ai_runs": {
                "by_status": dict(self._ai_run_counts),
                "by_workflow": ai_workflows,
            },
            "recent_guardrail_event_count": len(self._guardrail_events),
        }

    def recent_guardrail_events(self) -> list[dict[str, Any]]:
        return [asdict(item) for item in self._guardrail_events]


default_monitoring_service = MonitoringService()
