from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Sequence
from typing import Any, TypeVar

from agents import Agent, ModelSettings, RunConfig, Runner
from agents.models.multi_provider import MultiProvider
from pydantic import BaseModel

from app.core.ai_usage import AIUsageDetails
from app.core.config import settings
from app.core.monitoring import default_monitoring_service

OutputT = TypeVar("OutputT", bound=BaseModel)
RunnerCallable = Callable[..., Awaitable[Any]]
UsageHook = Callable[[AIUsageDetails], Awaitable[None]]


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
        max_output_tokens: int | None = None,
        usage_hook: UsageHook | None = None,
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
                max_tokens=max_output_tokens or settings.agent_max_output_tokens,
                truncation="auto",
                store=False,
            ),
        )
        try:
            result = await self._runner(
                agent,
                self._serialize_payload(payload),
                max_turns=max_turns,
                run_config=RunConfig(
                    model=settings.openai_model,
                    model_provider=MultiProvider(
                        openai_api_key=settings.openai_api_key,
                        openai_base_url=settings.openai_api_base_url,
                    ),
                    tracing_disabled=True,
                    workflow_name=f"HealthSphere {agent_name}",
                ),
            )
        except Exception:
            default_monitoring_service.record_ai_run(
                workflow=agent_name,
                status="error",
                request_count=0,
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                estimated_cost_usd=0.0,
            )
            raise

        usage_details = self._extract_usage_details(result)
        if usage_hook is not None:
            await usage_hook(usage_details)
        elif usage_details.total_tokens > 0:
            default_monitoring_service.record_ai_run(
                workflow=agent_name,
                status="completed",
                request_count=usage_details.requests,
                input_tokens=usage_details.input_tokens,
                output_tokens=usage_details.output_tokens,
                total_tokens=usage_details.total_tokens,
                estimated_cost_usd=0.0,
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

    @staticmethod
    def _extract_usage_details(result: Any) -> AIUsageDetails:
        usage = getattr(getattr(result, "context_wrapper", None), "usage", None)
        if usage is None:
            return AIUsageDetails()

        input_token_details = getattr(usage, "input_tokens_details", None)
        output_token_details = getattr(usage, "output_tokens_details", None)
        return AIUsageDetails(
            requests=int(getattr(usage, "requests", 0) or 0),
            input_tokens=int(getattr(usage, "input_tokens", 0) or 0),
            output_tokens=int(getattr(usage, "output_tokens", 0) or 0),
            total_tokens=int(getattr(usage, "total_tokens", 0) or 0),
            cached_input_tokens=int(
                getattr(input_token_details, "cached_tokens", 0) or 0
            ),
            reasoning_tokens=int(
                getattr(output_token_details, "reasoning_tokens", 0) or 0
            ),
        )


default_agent_runtime = AgentRuntime()
