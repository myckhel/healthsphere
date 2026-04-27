from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Sequence
from typing import Any, TypeVar

from agents import Agent, ModelSettings, RunConfig, Runner
from agents.models.multi_provider import MultiProvider
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
                max_tokens=settings.agent_max_output_tokens,
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
                model_provider=MultiProvider(
                    openai_api_key=settings.openai_api_key,
                    openai_api_base_url=settings.openai_api_base_url,
                ),
                tracing_disabled=True,
                workflow_name=f"HealthSphere {agent_name}",
            ),
        )
        return output_type.model_validate(result.final_output)

    @staticmethod
    def _serialize_payload(payload: dict[str, Any]) -> str:
        budgeted_payload = AgentRuntime._apply_budget(payload)
        serialized = json.dumps(budgeted_payload, default=str, sort_keys=True)
        if len(serialized) > settings.agent_payload_char_budget:
            raise RuntimeError(
                "Agent payload exceeded the configured budget after truncation."
            )
        return serialized

    @staticmethod
    def _apply_budget(value: Any) -> Any:
        if isinstance(value, str):
            max_chars = 1200
            if len(value) <= max_chars:
                return value
            return value[: max_chars - 3].rstrip() + "..."
        if isinstance(value, list):
            return [AgentRuntime._apply_budget(item) for item in value[:8]]
        if isinstance(value, dict):
            return {
                key: AgentRuntime._apply_budget(item)
                for index, (key, item) in enumerate(value.items())
                if index < 24
            }
        return value


default_agent_runtime = AgentRuntime()
