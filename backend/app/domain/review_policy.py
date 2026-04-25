from __future__ import annotations

import datetime as dt

_PENDING_REVIEW_STATUSES = {"pending", "needs_review"}
_HIGH_RISK_URGENCY = {"urgent", "emergency"}


def record_requires_clinician_review(review_status: str) -> bool:
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
    if record_requires_clinician_review(review_status):
        return None, None
    return reviewer_id, reviewed_at
