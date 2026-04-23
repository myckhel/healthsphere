from __future__ import annotations

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
