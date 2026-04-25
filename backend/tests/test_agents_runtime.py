import datetime as dt
import uuid
from types import SimpleNamespace

from app.agents.consultation_scribe import run_consultation_scribe_agent
from app.agents.intake import run_intake_agent
from app.agents.persistence import (
    apply_consultation_agent_draft,
    apply_record_digitization_draft,
    apply_triage_agent_draft,
)
from app.agents.record_digitization import run_record_digitization_agent
from app.agents.schemas import (
    ConsultationAgentOutput,
    IntakeAgentOutput,
    RecordDigitizationAgentOutput,
    TriageAgentOutput,
)
from app.agents.tools import build_agent_tools
from app.agents.triage import run_triage_agent
from app.models.consultation_session import ConsultationSession
from app.models.record import Record
from app.models.triage_case import TriageCase


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
