from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Sequence
from typing import Any, TypeVar

from agents import Agent, ModelSettings, RunConfig, Runner
from pydantic import BaseModel

from app.core.config import settings

OutputT = TypeVar("OutputT", bound=BaseModel)
RunnerCallable = Callable[..., Awaitable[Any]]


class AgentRuntime:
    def __init__(self, runner: RunnerCallable | None = None) -> None:
        self._runner = runner or Runner.run

    async def run_structured_agent(
        self,
        *,
        agent_name: str,
        instructions: str,
        output_type: type[OutputT],
        payload: dict[str, Any],
        tools: Sequence[Any] = (),
        max_turns: int = 6,
    ) -> OutputT:
        if self._runner is Runner.run and not settings.openai_api_key:
            raise RuntimeError(
                "OpenAI agent runtime is not configured. Set OPENAI_API_KEY before running agent workflows."
            )

        agent = Agent(
            name=agent_name,
            instructions=instructions,
            model=settings.openai_model,
            output_type=output_type,
            tools=list(tools),
            model_settings=ModelSettings(
                temperature=0,
                parallel_tool_calls=False,
                max_tokens=900,
                truncation="auto",
                store=False,
            ),
        )
        result = await self._runner(
            agent,
            self._serialize_payload(payload),
            max_turns=max_turns,
            run_config=RunConfig(
                model=settings.openai_model,
                tracing_disabled=True,
                workflow_name=f"HealthSphere {agent_name}",
            ),
        )
        return output_type.model_validate(result.final_output)

    @staticmethod
    def _serialize_payload(payload: dict[str, Any]) -> str:
        return json.dumps(payload, default=str, sort_keys=True)


default_agent_runtime = AgentRuntime()
