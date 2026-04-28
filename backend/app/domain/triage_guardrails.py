from __future__ import annotations

from typing import Any

from app.domain.review_policy import triage_requires_escalation

_RED_FLAG_KEYWORDS: dict[str, str] = {
    "chest pain": "possible cardiac complaint",
    "shortness of breath": "possible respiratory compromise",
    "bleeding": "possible acute blood loss",
    "seizure": "possible neurologic emergency",
    "unconscious": "possible loss of consciousness",
    "pregnant": "pregnancy-related risk needs escalation review",
}


def list_triage_red_flag_keywords() -> list[str]:
    return sorted(_RED_FLAG_KEYWORDS.keys())


def detect_red_flag_reasons(
    *,
    presenting_complaint: str,
    symptoms: list[str] | None,
) -> list[str]:
    combined = " ".join([presenting_complaint, *(symptoms or [])]).lower()
    reasons: list[str] = []
    for keyword, label in _RED_FLAG_KEYWORDS.items():
        if keyword in combined:
            reasons.append(label)
    return reasons


def apply_triage_guardrails(
    *,
    urgency_level: str,
    review_status: str,
    presenting_complaint: str,
    symptoms: list[str] | None,
    recommended_queue: str | None,
    recommended_action: str | None,
    model_output: dict[str, Any] | None,
) -> dict[str, Any]:
    red_flag_reasons = detect_red_flag_reasons(
        presenting_complaint=presenting_complaint,
        symptoms=symptoms,
    )
    escalate = triage_requires_escalation(
        urgency_level=urgency_level,
        review_status=review_status,
    ) or bool(red_flag_reasons)

    final_queue = recommended_queue
    final_action = recommended_action
    if escalate:
        final_queue = "emergency" if urgency_level.strip().lower() == "emergency" else "physician-now"
        final_action = (
            "Immediate clinician escalation required before discharge or routine queue placement."
        )

    merged_model_output = dict(model_output or {})
    merged_model_output["deterministic_guardrails"] = {
        "escalate_immediately": escalate,
        "red_flag_reasons": red_flag_reasons,
        "final_queue": final_queue,
    }

    return {
        "escalate_immediately": escalate,
        "red_flag_reasons": red_flag_reasons,
        "recommended_queue": final_queue,
        "recommended_action": final_action,
        "model_output": merged_model_output,
    }


def discharge_allowed_for_triage(*, urgency_level: str, red_flag_reasons: list[str]) -> bool:
    normalized_urgency = urgency_level.strip().lower()
    if normalized_urgency in {"urgent", "emergency"}:
        return False
    return not red_flag_reasons