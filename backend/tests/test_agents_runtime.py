import datetime as dt
import uuid
from types import SimpleNamespace

from app.agents.consultation_scribe import run_consultation_scribe_agent
from app.agents.intake import run_intake_agent
from app.agents.lab_result_translator import run_lab_result_translator_agent
from app.agents.runtime import AgentRuntime
from app.agents.persistence import (
    apply_consultation_agent_draft,
    apply_record_digitization_draft,
    apply_triage_agent_draft,
)
from app.agents.record_digitization import run_record_digitization_agent
from app.agents.schemas import (
    ConsultationAgentOutput,
    IntakeAgentOutput,
    LabResultTranslationAgentOutput,
    RecordDigitizationAgentOutput,
    TriageAgentOutput,
)
from app.agents.tools import build_agent_tools
from app.agents.triage import run_triage_agent
from app.core.config import settings
from app.models.consultation_session import ConsultationSession
from app.models.patient import Patient
from app.models.record import Record
from app.models.triage_case import TriageCase
from app.core.ai_usage import AIUsageDetails
from app.schemas.consultation import ConsultationLabResultTranslation
from app.services.consultation_support_service import ConsultationSupportService


class StubRuntime:
    def __init__(self, final_output):
        self.final_output = final_output
        self.calls = []

    async def run_structured_agent(self, **kwargs):
        self.calls.append(kwargs)
        return self.final_output


async def test_narrow_agents_validate_structured_outputs() -> None:
    payload = {
        "patient": {"first_name": "Ada"},
        "records": [{"title": "CBC result"}],
        "presenting_complaint": "Headache and dizziness",
    }

    intake_runtime = StubRuntime(
        IntakeAgentOutput(
            normalized_complaint="Headache and dizziness",
            symptom_terms=["headache", "dizziness"],
            review_status="needs_review",
        )
    )
    triage_runtime = StubRuntime(
        TriageAgentOutput(
            draft_summary="Non-emergency complaint draft",
            urgency_rationale="No deterministic red flag matched in the draft.",
            suggested_queue="general",
            review_status="needs_review",
        )
    )
    consultation_runtime = StubRuntime(
        ConsultationAgentOutput(
            subjective="Patient reports dizziness on standing.",
            assessment="Needs exam before conclusion.",
            plan="Hydration advice pending clinician exam.",
            review_status="needs_review",
        )
    )
    record_runtime = StubRuntime(
        RecordDigitizationAgentOutput(
            draft_summary="Draft lab abstraction",
            structured_data={"hemoglobin": 13.2},
            review_status="needs_review",
        )
    )

    intake_output = await run_intake_agent(payload, runtime=intake_runtime)
    triage_output = await run_triage_agent(payload, runtime=triage_runtime)
    consultation_output = await run_consultation_scribe_agent(payload, runtime=consultation_runtime)
    record_output = await run_record_digitization_agent(payload, runtime=record_runtime)

    assert intake_output["review_status"] == "needs_review"
    assert triage_output["suggested_queue"] == "general"
    assert consultation_output["assessment"] == "Needs exam before conclusion."
    assert record_output["structured_data"] == {"hemoglobin": 13.2}

    assert intake_runtime.calls[0]["agent_name"] == "intake_normalization"
    assert triage_runtime.calls[0]["output_type"] is TriageAgentOutput
    assert consultation_runtime.calls[0]["output_type"] is ConsultationAgentOutput
    assert record_runtime.calls[0]["output_type"] is RecordDigitizationAgentOutput


async def test_lab_result_translator_requests_higher_output_budget() -> None:
    runtime = StubRuntime(
        LabResultTranslationAgentOutput(
            clinician_summary="Clinician review summary.",
            patient_explanation="Patient-friendly explanation.",
            review_status="needs_review",
        )
    )

    result = await run_lab_result_translator_agent(
        {"record": {"record_id": "record-1", "raw_text": "CBC trend"}},
        runtime=runtime,
    )

    assert result["review_status"] == "needs_review"
    assert runtime.calls[0]["agent_name"] == "lab_result_translation"
    assert runtime.calls[0]["max_output_tokens"] == 1600
    assert "at most 8 key_observations" in runtime.calls[0]["instructions"]


async def test_cached_fallback_lab_translation_is_regenerated_when_ai_is_configured() -> None:
    now = dt.datetime(2026, 4, 28, 15, 0, tzinfo=dt.timezone.utc)
    record = Record(
        id=uuid.uuid4(),
        clinic_id=uuid.uuid4(),
        patient_id=uuid.uuid4(),
        title="CBC result",
        record_type="lab_result",
        source="upload",
        review_status="approved",
        created_at=now,
        updated_at=now,
    )
    consultation = ConsultationSession(
        id=uuid.uuid4(),
        clinic_id=record.clinic_id,
        patient_id=record.patient_id,
        clinician_id="clinician-1",
        status="in_progress",
        draft_note={
            "selected_lab_record_id": str(record.id),
            "translated_lab_result": {
                "source": "fallback",
                "generated_at": now.isoformat(),
                "review_status": "needs_review",
                "selected_record_id": str(record.id),
                "selected_record_title": record.title,
                "selected_record_created_at": now.isoformat(),
                "clinician_summary": "Fallback summary.",
                "patient_explanation": "Fallback explanation.",
                "abnormal_findings": [],
                "recommended_clinician_actions": [],
                "escalation_note": None,
                "key_observations": [],
            },
        },
    )
    patient = Patient(
        id=record.patient_id,
        clinic_id=record.clinic_id,
        first_name="Ada",
        last_name="Okafor",
        consent_status="granted",
    )

    regenerated = ConsultationLabResultTranslation(
        source="agent",
        generated_at=now,
        review_status="needs_review",
        selected_record_id=record.id,
        selected_record_title=record.title,
        selected_record_created_at=now,
        clinician_summary="Agent summary.",
        patient_explanation="Agent explanation.",
    )

    class FakeLabTranslationService:
        def __init__(self, response: ConsultationLabResultTranslation) -> None:
            self.response = response
            self.calls = 0

        async def translate_record(self, **_kwargs) -> ConsultationLabResultTranslation:
            self.calls += 1
            return self.response

    fake_service = FakeLabTranslationService(regenerated)
    service = ConsultationSupportService(lab_result_translation_service=fake_service)

    original_openai_api_key = settings.openai_api_key
    settings.openai_api_key = "configured"
    try:
        result = await service.build_translated_lab_result(
            SimpleNamespace(),
            selected_lab_record=record,
            consultation=consultation,
            patient=patient,
            actor_id="clinician-1",
            actor_role="clinician",
            request_id="req-1",
        )
    finally:
        settings.openai_api_key = original_openai_api_key

    assert result == regenerated
    assert fake_service.calls == 1


def test_agent_tools_expose_expected_boundaries() -> None:
    tools = build_agent_tools(
        patient={"id": "patient-1"},
        records=[{"title": "CBC"}, {"title": "Vitals"}],
    )
    tool_names = {tool.name for tool in tools}

    assert tool_names == {
        "lookup_patient",
        "retrieve_patient_records",
        "lookup_clinic_policy",
        "evaluate_red_flags",
    }


def test_agent_persistence_helpers_keep_outputs_draft_only() -> None:
    now = dt.datetime(2026, 4, 25, 9, 0, tzinfo=dt.timezone.utc)
    triage_case = TriageCase(
        id=uuid.uuid4(),
        clinic_id=uuid.uuid4(),
        source="intake",
        status="open",
        urgency_level="routine",
        presenting_complaint="Headache",
        review_status="approved",
        reviewed_by="clinician-1",
        reviewed_at=now,
    )
    consultation = ConsultationSession(
        id=uuid.uuid4(),
        clinic_id=uuid.uuid4(),
        patient_id=uuid.uuid4(),
        status="in_progress",
        clinician_id="clinician-1",
    )
    record = Record(
        id=uuid.uuid4(),
        clinic_id=uuid.uuid4(),
        patient_id=uuid.uuid4(),
        title="CBC result",
        record_type="lab",
        source="upload",
        review_status="approved",
        reviewed_by="clinician-1",
        reviewed_at=now,
    )

    apply_triage_agent_draft(
        triage_case,
        TriageAgentOutput(
            draft_summary="Draft queue recommendation",
            urgency_rationale="Needs clinician review.",
            suggested_queue="general",
            review_status="needs_review",
        ),
    )
    apply_consultation_agent_draft(
        consultation,
        ConsultationAgentOutput(
            subjective="Draft subjective",
            assessment="Draft assessment",
            plan="Draft plan",
            review_status="needs_review",
        ),
    )
    apply_record_digitization_draft(
        record,
        RecordDigitizationAgentOutput(
            draft_summary="Draft digitization",
            structured_data={"pulse": 72},
            review_status="needs_review",
        ),
        actor_id="clinician-1",
    )

    assert triage_case.review_status == "needs_review"
    assert triage_case.reviewed_by is None
    assert triage_case.reviewed_at is None
    assert triage_case.model_output["agent_name"] == "triage_support"

    assert consultation.draft_note["agent_name"] == "consultation_support"
    assert consultation.draft_note["review_status"] == "needs_review"

    assert record.review_status == "needs_review"
    assert record.reviewed_by is None
    assert record.reviewed_at is None
    assert record.structured_data == {"pulse": 72}
    assert record.provenance["agent_digitization_draft"]["review_status"] == "needs_review"


def test_agent_runtime_serialization_enforces_payload_budget() -> None:
    serialized = AgentRuntime._serialize_payload(
        {
            "patient": {
                "notes": "x" * 5000,
                "history": ["y" * 3000 for _ in range(20)],
            }
        }
    )

    assert len(serialized) < 12000
    assert "..." in serialized


async def test_agent_runtime_extracts_usage_and_invokes_usage_hook() -> None:
    recorded: list[AIUsageDetails] = []

    async def fake_runner(*_args, **_kwargs):
        return SimpleNamespace(
            final_output=IntakeAgentOutput(
                normalized_complaint="Headache and dizziness",
                symptom_terms=["headache", "dizziness"],
                review_status="needs_review",
            ),
            context_wrapper=SimpleNamespace(
                usage=SimpleNamespace(
                    requests=2,
                    input_tokens=150,
                    output_tokens=45,
                    total_tokens=195,
                    input_tokens_details=SimpleNamespace(cached_tokens=30),
                    output_tokens_details=SimpleNamespace(reasoning_tokens=5),
                )
            ),
        )

    async def usage_hook(details: AIUsageDetails) -> None:
        recorded.append(details)

    runtime = AgentRuntime(runner=fake_runner)
    result = await runtime.run_structured_agent(
        agent_name="intake_normalization",
        instructions="Normalize the intake.",
        output_type=IntakeAgentOutput,
        payload={"patient": {"first_name": "Ada"}},
        usage_hook=usage_hook,
    )

    assert result.review_status == "needs_review"
    assert recorded == [
        AIUsageDetails(
            requests=2,
            input_tokens=150,
            output_tokens=45,
            total_tokens=195,
            cached_input_tokens=30,
            reasoning_tokens=5,
        )
    ]
