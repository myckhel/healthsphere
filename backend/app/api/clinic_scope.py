from __future__ import annotations

import uuid

from fastapi import HTTPException, status

from app.schemas.common import RequestActor


def parse_actor_clinic_id(actor: RequestActor) -> uuid.UUID | None:
    if not actor.clinic_id:
        return None
    try:
        return uuid.UUID(actor.clinic_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid clinic scope in actor context.",
        ) from exc


def resolve_clinic_scope(
    *,
    actor: RequestActor,
    requested_clinic_id: uuid.UUID | None,
) -> uuid.UUID | None:
    actor_clinic_id = parse_actor_clinic_id(actor)
    if actor_clinic_id and requested_clinic_id and actor_clinic_id != requested_clinic_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Actor cannot write outside the assigned clinic scope.",
        )
    return requested_clinic_id or actor_clinic_id
