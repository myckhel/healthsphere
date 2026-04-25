from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from agents import function_tool


def _build_policy_map() -> dict[str, dict[str, str]]:
    return {
        "triage-escalation": {
            "policy": "Escalate chest pain, severe shortness of breath, heavy bleeding, or altered consciousness immediately.",
            "owner": "clinic",
        },
        "draft-safety": {
            "policy": "All AI output is draft-only and requires clinician review before final use.",
            "owner": "clinic",
        },
        "record-digitization": {
            "policy": "Preserve source uncertainty and do not infer values absent from the supplied document text.",
            "owner": "clinic",
        },
    }


def build_agent_tools(
    *,
    patient: dict[str, Any] | None = None,
    records: Sequence[dict[str, Any]] | None = None,
) -> list[Any]:
    patient_context = patient or {}
    record_context = list(records or [])
    clinic_policy_map = _build_policy_map()

    @function_tool(name_override="lookup_patient")
    async def lookup_patient() -> dict[str, Any]:
        """Return the current patient context already approved for this agent run."""
        return patient_context

    @function_tool(name_override="retrieve_patient_records")
    async def retrieve_patient_records(limit: int = 3) -> list[dict[str, Any]]:
        """Return a bounded list of existing patient records for retrieval-grounded drafting."""
        bounded_limit = max(1, min(limit, 5))
        return record_context[:bounded_limit]

    @function_tool(name_override="lookup_clinic_policy")
    async def lookup_clinic_policy(policy_name: str) -> dict[str, str]:
        """Return a named clinic policy snippet used to constrain draft generation."""
        return clinic_policy_map.get(
            policy_name,
            {
                "policy": "No matching clinic policy was found. Stay conservative and keep output draft-only.",
                "owner": "fallback",
            },
        )

    @function_tool(name_override="evaluate_red_flags")
    async def evaluate_red_flags(
        presenting_complaint: str,
        symptoms: list[str] | None = None,
    ) -> dict[str, Any]:
        """Deterministically score obvious red flags from complaint text and symptom terms."""
        combined = " ".join([presenting_complaint, *(symptoms or [])]).lower()
        matched_flags: list[str] = []
        flag_map = {
            "chest pain": "possible cardiac complaint",
            "shortness of breath": "possible respiratory compromise",
            "bleeding": "possible acute blood loss",
            "seizure": "possible neurologic emergency",
            "unconscious": "possible loss of consciousness",
            "pregnant": "pregnancy-related risk needs escalation review",
        }
        for needle, label in flag_map.items():
            if needle in combined:
                matched_flags.append(label)

        return {
            "matched_flags": matched_flags,
            "escalate_immediately": bool(matched_flags),
        }

    return [
        lookup_patient,
        retrieve_patient_records,
        lookup_clinic_policy,
        evaluate_red_flags,
    ]
