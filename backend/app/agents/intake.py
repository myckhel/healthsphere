from __future__ import annotations

from typing import Any

from app.agents.runtime import AgentRuntime, UsageHook, default_agent_runtime
from app.agents.schemas import IntakeAgentOutput
from app.agents.tools import build_agent_tools


async def run_intake_agent(
    payload: dict[str, Any],
    *,
    runtime: AgentRuntime | None = None,
    usage_hook: UsageHook | None = None,
) -> dict[str, Any]:
    runtime = runtime or default_agent_runtime
    result = await runtime.run_structured_agent(
        agent_name="intake_normalization",
        instructions=(
            "Normalize the patient intake into concise clinical draft language. "
            "Use structured outputs only. Never provide a final diagnosis. "
            "Keep all output draft-only and set review_status to needs_review."
        ),
        output_type=IntakeAgentOutput,
        payload=payload,
        tools=build_agent_tools(
            patient=payload.get("patient"),
            records=payload.get("records"),
        ),
        usage_hook=usage_hook,
    )
    return result.model_dump()
