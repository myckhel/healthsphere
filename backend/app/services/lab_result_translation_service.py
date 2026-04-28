from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.agents.lab_result_translator import run_lab_result_translator_agent
from app.core.ai_usage import AIUsageContext
from app.core.config import settings
from app.domain.record_types import is_lab_result_record_type
from app.models.record import Record
from app.schemas.consultation import (
    ConsultationLabObservation,
    ConsultationLabResultTranslation,
)
from app.services.ai_usage_service import AIUsageService


class LabResultTranslationService:
    def __init__(self, ai_usage_service: AIUsageService | None = None) -> None:
        self.ai_usage_service = ai_usage_service or AIUsageService()

    async def translate_record(
        self,
        *,
        record: Record,
        db=None,
        usage_context: AIUsageContext | None = None,
    ) -> ConsultationLabResultTranslation:
        if not is_lab_result_record_type(record.record_type):
            raise ValueError("Selected record is not a supported lab result.")

        if settings.openai_api_key:
            try:
                usage_hook = None
                if db is not None and usage_context is not None:
                    async def usage_hook(details):
                        await self.ai_usage_service.record_usage(
                            db,
                            context=usage_context,
                            usage=details,
                            model=settings.openai_model,
                        )

                result = await run_lab_result_translator_agent(
                    self._build_payload(record),
                    usage_hook=usage_hook,
                )
                return ConsultationLabResultTranslation(
                    source="agent",
                    generated_at=datetime.now(timezone.utc),
                    review_status=result.get("review_status", "needs_review"),
                    selected_record_id=record.id,
                    selected_record_title=record.title,
                    selected_record_created_at=record.created_at,
                    clinician_summary=result.get("clinician_summary")
                    or "Lab result requires clinician review.",
                    patient_explanation=result.get("patient_explanation")
                    or "This lab result was translated into simpler language for review with a clinician.",
                    abnormal_findings=list(result.get("abnormal_findings") or []),
                    recommended_clinician_actions=list(
                        result.get("recommended_clinician_actions") or []
                    ),
                    escalation_note=result.get("escalation_note"),
                    key_observations=[
                        ConsultationLabObservation.model_validate(item)
                        for item in result.get("key_observations") or []
                    ],
                )
            except Exception:
                pass

        return self._build_fallback_translation(record)

    def _build_payload(self, record: Record) -> dict[str, Any]:
        return {
            "record": {
                "record_id": str(record.id),
                "title": record.title,
                "record_type": record.record_type,
                "review_status": record.review_status,
                "created_at": record.created_at.isoformat(),
                "raw_text": record.raw_text or "",
                "structured_data": record.structured_data or {},
                "provenance": record.provenance or {},
            }
        }

    def _build_fallback_translation(
        self,
        record: Record,
    ) -> ConsultationLabResultTranslation:
        observations = self._extract_observations(record)
        abnormal_findings = [
            observation.interpretation or f"{observation.name}: {observation.value}"
            for observation in observations
            if observation.flag in {"high", "low", "abnormal", "critical"}
        ]
        critical_findings = [
            item for item in abnormal_findings if "critical" in item.lower()
        ]
        if not abnormal_findings:
            abnormal_findings = self._extract_textual_flags(record.raw_text)

        clinician_summary_parts = [
            f"Selected lab record: {record.title}.",
            f"Extracted {len(observations)} observation(s) for clinician review."
            if observations
            else "The lab record did not expose structured observations reliably.",
        ]
        if abnormal_findings:
            clinician_summary_parts.append(
                "Possible abnormal findings: " + "; ".join(abnormal_findings[:3]) + "."
            )
        else:
            clinician_summary_parts.append(
                "No explicit abnormal flags were found automatically; confirm the raw report directly."
            )

        patient_explanation = (
            "This lab report was translated into simpler language to support your consultation. "
            "A clinician still needs to confirm the values, what they mean, and whether any action is needed."
        )
        if abnormal_findings:
            patient_explanation += " Some results may be outside the expected range, so the clinician should review them with you."

        recommended_actions = [
            "Confirm the values, units, and reference ranges directly from the original lab report before finalizing the care plan.",
            "Correlate any abnormal or critical result with the current symptoms and exam findings.",
        ]
        if not observations:
            recommended_actions.append(
                "If the report structure is unclear, review the full raw text or uploaded document before relying on the summary."
            )
        if abnormal_findings:
            recommended_actions.append(
                "Explain the important findings to the patient in plain language and document the clinician-approved follow-up."
            )

        escalation_note = None
        if critical_findings or self._contains_critical_language(record.raw_text):
            escalation_note = (
                "Potential critical lab wording was detected. Confirm the result urgently and escalate according to clinic protocol if the finding is clinically significant."
            )

        return ConsultationLabResultTranslation(
            source="fallback",
            generated_at=datetime.now(timezone.utc),
            review_status="needs_review",
            selected_record_id=record.id,
            selected_record_title=record.title,
            selected_record_created_at=record.created_at,
            clinician_summary=" ".join(clinician_summary_parts),
            patient_explanation=patient_explanation,
            abnormal_findings=abnormal_findings,
            recommended_clinician_actions=recommended_actions,
            escalation_note=escalation_note,
            key_observations=observations,
        )

    def _extract_observations(self, record: Record) -> list[ConsultationLabObservation]:
        structured_data = record.structured_data or {}
        observations: list[ConsultationLabObservation] = []

        for key, value in structured_data.items():
            if key in {"draft_summary", "extracted_observations"}:
                continue
            observations.extend(self._extract_observations_from_value(key, value))
            if len(observations) >= 8:
                break

        deduped: list[ConsultationLabObservation] = []
        seen: set[tuple[str, str]] = set()
        for observation in observations:
            signature = (observation.name.lower(), observation.value.lower())
            if signature in seen:
                continue
            seen.add(signature)
            deduped.append(observation)
        return deduped[:8]

    def _extract_observations_from_value(
        self,
        key: str,
        value: Any,
    ) -> list[ConsultationLabObservation]:
        if value is None:
            return []
        if isinstance(value, dict):
            if any(field in value for field in {"value", "unit", "reference_range", "flag"}):
                return [
                    self._build_observation(
                        name=str(value.get("name") or self._humanize_key(key)),
                        value=value.get("value"),
                        unit=value.get("unit"),
                        reference_range=value.get("reference_range") or value.get("referenceRange"),
                        flag=value.get("flag"),
                        interpretation=value.get("interpretation"),
                    )
                ]
            nested: list[ConsultationLabObservation] = []
            for nested_key, nested_value in value.items():
                nested.extend(
                    self._extract_observations_from_value(
                        f"{key}_{nested_key}",
                        nested_value,
                    )
                )
                if len(nested) >= 8:
                    break
            return nested
        if isinstance(value, list):
            nested: list[ConsultationLabObservation] = []
            for item in value:
                nested.extend(self._extract_observations_from_value(key, item))
                if len(nested) >= 8:
                    break
            return nested
        if isinstance(value, (str, int, float, bool)):
            text_value = str(value).strip()
            if not text_value:
                return []
            return [
                self._build_observation(
                    name=self._humanize_key(key),
                    value=text_value,
                    flag=self._infer_flag(text_value),
                )
            ]
        return []

    def _build_observation(
        self,
        *,
        name: str,
        value: Any,
        unit: Any = None,
        reference_range: Any = None,
        flag: Any = None,
        interpretation: Any = None,
    ) -> ConsultationLabObservation:
        value_text = str(value).strip() if value is not None else "Not recorded"
        flag_text = self._normalize_flag(flag or value_text)
        interpretation_text = (
            str(interpretation).strip() if interpretation is not None else None
        )
        if interpretation_text is None and flag_text in {"high", "low", "abnormal", "critical"}:
            interpretation_text = f"{name} may be {flag_text}."
        return ConsultationLabObservation(
            name=name,
            value=value_text,
            unit=str(unit).strip() if unit not in {None, ""} else None,
            reference_range=str(reference_range).strip()
            if reference_range not in {None, ""}
            else None,
            flag=flag_text,
            interpretation=interpretation_text,
        )

    def _extract_textual_flags(self, raw_text: str | None) -> list[str]:
        if not raw_text:
            return []
        findings: list[str] = []
        for line in raw_text.splitlines():
            normalized = line.strip()
            if not normalized:
                continue
            if any(
                token in normalized.lower()
                for token in ("critical", "abnormal", "elevated", "high", "low", "positive")
            ):
                findings.append(normalized)
            if len(findings) >= 4:
                break
        return findings

    def _contains_critical_language(self, raw_text: str | None) -> bool:
        if not raw_text:
            return False
        lowered = raw_text.lower()
        return any(token in lowered for token in ("critical", "panic value", "urgent", "immediate"))

    def _infer_flag(self, value: str) -> str | None:
        lowered = value.lower()
        if "critical" in lowered:
            return "critical"
        if any(token in lowered for token in ("high", "elevated", "raised", "positive")):
            return "high"
        if any(token in lowered for token in ("low", "decreased", "reduced")):
            return "low"
        if any(token in lowered for token in ("abnormal", "borderline")):
            return "abnormal"
        return None

    def _normalize_flag(self, value: Any) -> str | None:
        if value is None:
            return None
        lowered = str(value).strip().lower()
        if lowered in {"normal", "high", "low", "abnormal", "critical", "unknown"}:
            return lowered
        return self._infer_flag(lowered)

    def _humanize_key(self, key: str) -> str:
        return " ".join(part.capitalize() for part in key.replace("-", " ").replace("_", " ").split())