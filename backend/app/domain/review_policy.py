from __future__ import annotations

import datetime as dt

_PENDING_REVIEW_STATUSES = {"pending", "needs_review"}
_HIGH_RISK_URGENCY = {"urgent", "emergency"}


def record_requires_clinician_review(review_status: str) -> bool:
    """Pending-like states remain drafts and must not stamp reviewer metadata."""
    return review_status.strip().lower() in _PENDING_REVIEW_STATUSES


def triage_requires_escalation(*, urgency_level: str, review_status: str) -> bool:
    normalized_urgency = urgency_level.strip().lower()
    normalized_review_status = review_status.strip().lower()
    return (
        normalized_urgency in _HIGH_RISK_URGENCY
        or normalized_review_status in _PENDING_REVIEW_STATUSES
    )


def resolve_record_review_transition(
    *,
    review_status: str,
    reviewer_id: str,
    reviewed_at: dt.datetime,
) -> tuple[str | None, dt.datetime | None]:
    """Backward-compatible wrapper for record review transitions."""
    return resolve_review_transition(
        review_status=review_status,
        reviewer_id=reviewer_id,
        reviewed_at=reviewed_at,
    )


def resolve_review_transition(
    *,
    review_status: str,
    reviewer_id: str,
    reviewed_at: dt.datetime,
) -> tuple[str | None, dt.datetime | None]:
    """Apply the shared draft-only review policy across write paths.

    Any status in the pending set is still clinician-reviewable draft material, so
    reviewer fields stay unset. Non-pending states are treated as explicitly
    reviewed and receive reviewer metadata from the acting user.
    """
    if record_requires_clinician_review(review_status):
        return None, None
    return reviewer_id, reviewed_at
