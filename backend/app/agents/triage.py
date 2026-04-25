from __future__ import annotations

from typing import Any

from app.agents.runtime import AgentRuntime, default_agent_runtime
from app.agents.schemas import TriageAgentOutput
from app.agents.tools import build_agent_tools


async def run_triage_agent(
    payload: dict[str, Any],
    *,
    runtime: AgentRuntime | None = None,
) -> dict[str, Any]:
    runtime = runtime or default_agent_runtime
    result = await runtime.run_structured_agent(
        agent_name="triage_support",
        instructions=(
            "Draft triage support only. Use available tools for patient context, clinic policy, "
            "record retrieval, and deterministic red flag checks. Return structured output only. "
            "Never claim clinician approval and always set review_status to needs_review."
        ),
        output_type=TriageAgentOutput,
        payload=payload,
        tools=build_agent_tools(
            patient=payload.get("patient"),
            records=payload.get("records"),
        ),
    )
    return result.model_dump()
