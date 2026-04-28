from __future__ import annotations

from typing import Any

from app.agents.runtime import AgentRuntime, UsageHook, default_agent_runtime
from app.agents.schemas import RecordDigitizationAgentOutput
from app.agents.tools import build_agent_tools


async def run_record_digitization_agent(
    payload: dict[str, Any],
    *,
    runtime: AgentRuntime | None = None,
    usage_hook: UsageHook | None = None,
) -> dict[str, Any]:
    runtime = runtime or default_agent_runtime
    result = await runtime.run_structured_agent(
        agent_name="record_digitization",
        instructions=(
            "Extract draft structured medical record data from the supplied text or OCR output. "
            "Preserve uncertainty, avoid unsupported inference, and return structured outputs only. "
            "Keep review_status as needs_review."
        ),
        output_type=RecordDigitizationAgentOutput,
        payload=payload,
        tools=build_agent_tools(
            patient=payload.get("patient"),
            records=payload.get("records"),
        ),
        usage_hook=usage_hook,
    )
    return result.model_dump()
