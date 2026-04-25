from __future__ import annotations

from typing import Any

from app.agents.runtime import AgentRuntime, default_agent_runtime
from app.agents.schemas import ConsultationAgentOutput
from app.agents.tools import build_agent_tools


async def run_consultation_scribe_agent(
    payload: dict[str, Any],
    *,
    runtime: AgentRuntime | None = None,
) -> dict[str, Any]:
    runtime = runtime or default_agent_runtime
    result = await runtime.run_structured_agent(
        agent_name="consultation_support",
        instructions=(
            "Draft a clinician-facing consultation note scaffold from the supplied encounter context. "
            "Use structured outputs only. Use tools for patient lookup, record retrieval, and clinic policy. "
            "Do not finalize assessment; keep everything draft-only with review_status needs_review."
        ),
        output_type=ConsultationAgentOutput,
        payload=payload,
        tools=build_agent_tools(
            patient=payload.get("patient"),
            records=payload.get("records"),
        ),
    )
    return result.model_dump()
