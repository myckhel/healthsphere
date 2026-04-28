from __future__ import annotations

from typing import Any

from app.agents.runtime import AgentRuntime, UsageHook, default_agent_runtime
from app.agents.schemas import LabResultTranslationAgentOutput


async def run_lab_result_translator_agent(
    payload: dict[str, Any],
    *,
    runtime: AgentRuntime | None = None,
    usage_hook: UsageHook | None = None,
) -> dict[str, Any]:
    runtime = runtime or default_agent_runtime
    result = await runtime.run_structured_agent(
        agent_name="lab_result_translation",
        instructions=(
            "Translate the selected lab-result record into structured clinician support. "
            "Summarize the lab findings in plain language, identify abnormal or critical signals, "
            "and produce a separate patient-friendly explanation. "
            "Do not diagnose, do not prescribe, and do not invent reference ranges or units. "
            "If the record is incomplete or ambiguous, say so explicitly and recommend clinician verification."
        ),
        output_type=LabResultTranslationAgentOutput,
        payload=payload,
        usage_hook=usage_hook,
    )
    return result.model_dump()