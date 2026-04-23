from __future__ import annotations

from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.schemas.common import RequestActor

_ALLOWED_ROLES = {"patient", "staff", "clinician", "admin"}


async def get_request_actor(request: Request) -> RequestActor:
    if settings.auth_mode == "disabled":
        return RequestActor(
            subject="local-disabled-auth",
            role="admin",
            clinic_id=None,
            auth_provider="disabled",
        )

    if settings.auth_mode == "clerk":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                "Clerk verification is the configured auth mode, but the backend Clerk boundary "
                "has not been implemented yet."
            ),
        )

    subject = request.headers.get(settings.stub_auth_header)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Missing actor identity. Clerk verification is not wired yet. "
                f"Send {settings.stub_auth_header} for local development."
            ),
        )

    role = request.headers.get(settings.stub_role_header, "staff").strip().lower()
    if role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid actor role '{role}'. "
                f"Expected one of: {', '.join(sorted(_ALLOWED_ROLES))}."
            ),
        )

    clinic_id = request.headers.get(settings.stub_clinic_header)
    return RequestActor(
        subject=subject,
        role=role,
        clinic_id=clinic_id,
        auth_provider="stub",
    )
