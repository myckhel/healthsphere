from __future__ import annotations

import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_ALLOWED_ENVIRONMENTS = {"development", "test", "staging", "production"}
_ALLOWED_AUTH_MODES = {"stub", "disabled", "clerk"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "HealthSphere API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+asyncpg://healthsphere:healthsphere@localhost:5432/healthsphere"
    )
    database_url_sync: str = "postgresql://healthsphere:healthsphere@localhost:5432/healthsphere"

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    auth_mode: str = "stub"
    stub_auth_header: str = "X-HealthSphere-Actor-Id"
    stub_role_header: str = "X-HealthSphere-Actor-Role"
    stub_clinic_header: str = "X-HealthSphere-Clinic-Id"

    clerk_publishable_key: str | None = None
    clerk_secret_key: str | None = None
    clerk_jwks_url: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    agent_payload_char_budget: int = 12000
    agent_max_output_tokens: int = 900

    retrieval_result_limit: int = 5
    retrieval_candidate_chunk_limit: int = 50

    expensive_endpoint_rate_limit: int = 20
    expensive_endpoint_rate_window_seconds: int = 60

    calendly_api_token: str | None = None

    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_messaging_service_sid: str | None = None

    @model_validator(mode="after")
    def validate_runtime_options(self) -> "Settings":
        if self.environment not in _ALLOWED_ENVIRONMENTS:
            raise ValueError(
                f"ENVIRONMENT must be one of {sorted(_ALLOWED_ENVIRONMENTS)}."
            )
        if self.auth_mode not in _ALLOWED_AUTH_MODES:
            raise ValueError(f"AUTH_MODE must be one of {sorted(_ALLOWED_AUTH_MODES)}.")
        if self.environment != "development" and self.auth_mode == "stub":
            logger.warning("Stub auth is enabled outside development. Wire Clerk before deployment.")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
