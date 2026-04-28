from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.api.deps import get_request_actor
from app.core.config import settings
from app.core.monitoring import default_monitoring_service
from app.schemas.common import RequestActor
from app.services.rate_limit_service import default_rate_limit_service


def rate_limit_expensive_endpoint(bucket_name: str):
    async def dependency(
        request: Request,
        actor: RequestActor = Depends(get_request_actor),
    ) -> None:
        allowed, _remaining = default_rate_limit_service.allow(
            key=(
                f"{bucket_name}:{actor.subject}:{actor.clinic_id or 'global'}:{request.method}"
            ),
            max_requests=settings.expensive_endpoint_rate_limit,
            window_seconds=settings.expensive_endpoint_rate_window_seconds,
        )
        if not allowed:
            default_monitoring_service.record_guardrail_event(
                event_type="rate_limit_exceeded",
                message="Rate limit exceeded for this expensive endpoint.",
                route=request.url.path,
                actor_role=actor.role,
                clinic_id=actor.clinic_id,
                request_id=getattr(request.state, "request_id", None),
                metadata={"bucket_name": bucket_name},
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for this expensive endpoint.",
            )

    return dependency