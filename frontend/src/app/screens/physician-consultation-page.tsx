import { ChevronLeft, FileText, ShieldAlert, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function PhysicianConsultationPage() {
  const navigate = useNavigate();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const consultationSession = useAppStore((state) => state.consultationSession);
  const startConsultation = useAppStore((state) => state.startConsultation);
  const firstName = patientDraft.fullName.split(" ")[0];

  const sessionTone =
    consultationSession.status === "in-progress"
      ? "info"
      : consultationSession.status === "completed"
        ? "review"
        : "success";

  const sessionLabel =
    consultationSession.status === "in-progress"
      ? "Consultation in progress"
      : consultationSession.status === "completed"
        ? "Consultation completed"
        : "Consultation ready";

  function handleConsultationAction() {
    if (consultationSession.status === "completed") {
      navigate("/physician/consultation/outcome");
      return;
    }

    if (consultationSession.status !== "in-progress") {
      startConsultation();
    }

    navigate("/physician/consultation/active");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Consultation workspace
          </p>
          <h2 className="mt-2 text-3xl text-ink">{patientDraft.fullName}</h2>
        </div>

        <Button variant="ghost" asChild>
          <Link to="/physician/queue">
            <ChevronLeft className="h-4 w-4" />
            Back to queue
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient snapshot
                </p>
                <h3 className="mt-2 text-2xl text-ink">
                  Ready to begin the visit
                </h3>
              </div>
              <StatusPill tone={sessionTone}>{sessionLabel}</StatusPill>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient ID number
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.patientId || "Needs physician assignment"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Preferred language
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.preferredLanguage}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit type
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.visitType}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Symptom duration
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.symptomDuration}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient summary
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientDraft.symptoms}
                </dd>
              </div>
            </dl>
          </Card>

          <InfoBanner
            title="Review before relying on the draft note"
            tone="review"
            icon={<ShieldAlert className="h-4 w-4 text-warning" />}
          >
            AI assistance should help the physician start faster, but the final
            clinical assessment must come from the consultation itself.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">Consultation checklist</h3>
                <p className="text-sm text-muted">
                  Suggested first steps before documenting a final note.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted">
              <p>
                Confirm identity and ask {firstName} to describe the main
                complaint again in their own words.
              </p>
              <p>
                Confirm the existing patient ID or assign a new one so the
                visit can be linked to historical clinic records.
              </p>
              <p>
                Check for urgent red flags before using the draft note to
                structure the conversation.
              </p>
              <p>
                Document the final plan only after the clinician has completed
                the assessment.
              </p>
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                AI draft note
              </p>
              <h3 className="mt-2 text-2xl text-ink">
                Assistive summary for review
              </h3>
            </div>
            <StatusPill tone="review">Draft only</StatusPill>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-soft text-info">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Draft summary</p>
                <p className="text-sm text-muted">
                  Generated from patient onboarding and symptom intake
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5 text-sm leading-6 text-muted">
              <div>
                <p className="font-semibold text-ink">Chief concern</p>
                <p>{patientDraft.symptoms}</p>
              </div>

              <div>
                <p className="font-semibold text-ink">
                  Context available before consultation
                </p>
                <p>
                  {firstName} selected {patientDraft.visitType.toLowerCase()}{" "}
                  and reported symptoms present for{" "}
                  {patientDraft.symptomDuration.toLowerCase()}.
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Suggested opening note</p>
                <p>
                  Patient presents for an initial review after completing the
                  intake flow. Clinician should verify symptom severity, ask
                  targeted follow-up questions, and confirm the final plan after
                  assessment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleConsultationAction}>
              {consultationSession.status === "in-progress"
                ? "Resume consultation"
                : consultationSession.status === "completed"
                  ? "Review outcome"
                  : "Start consultation"}
              <Stethoscope className="h-4 w-4" />
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/physician/queue">Return to queue</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
