import { ChevronLeft, FileText, ShieldAlert, Stethoscope } from "lucide-react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  consultationNextActions,
  consultationNoteSections,
} from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import {
  type ConsultationDraft,
  type ConsultationNextAction,
  useAppStore,
} from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";
import { Textarea } from "@/shared/ui/textarea";

function formatSessionTime(value: string | null) {
  if (!value) {
    return "Not started";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhysicianConsultationActivePage() {
  const navigate = useNavigate();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const consultationSession = useAppStore((state) => state.consultationSession);
  const consultationDraft = useAppStore((state) => state.consultationDraft);
  const updateConsultationDraft = useAppStore(
    (state) => state.updateConsultationDraft,
  );
  const setConsultationNextAction = useAppStore(
    (state) => state.setConsultationNextAction,
  );
  const completeConsultation = useAppStore(
    (state) => state.completeConsultation,
  );

  const nextAction: ConsultationNextAction =
    consultationSession.nextAction ?? "follow-up-booking";
  const firstName = patientDraft.fullName.split(" ")[0];
  const canComplete =
    consultationDraft.assessment.trim().length >= 12 &&
    consultationDraft.carePlan.trim().length >= 12;

  function updateField<K extends keyof ConsultationDraft>(
    key: K,
    value: ConsultationDraft[K],
  ) {
    updateConsultationDraft({
      [key]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canComplete) {
      return;
    }

    completeConsultation(nextAction);
    navigate("/physician/consultation/outcome");
  }

  if (consultationSession.status !== "in-progress") {
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Consultation notes
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Start the consultation before documenting the visit.
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted">
          This screen is reserved for an active visit. Return to the readiness
          workspace to begin or resume the right patient handoff.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/physician/consultation">
              Return to consultation workspace
              <Stethoscope className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="secondary" asChild>
            <Link to="/physician/queue">Back to queue</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Active consultation
          </p>
          <h2 className="mt-2 text-3xl text-ink">{patientDraft.fullName}</h2>
        </div>

        <Button variant="ghost" asChild>
          <Link to="/physician/consultation">
            <ChevronLeft className="h-4 w-4" />
            Back to readiness
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Consultation status
                </p>
                <h3 className="mt-2 text-2xl text-ink">Visit in progress</h3>
              </div>
              <StatusPill tone="info">In progress</StatusPill>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Clinician
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {consultationSession.clinicianName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Started at
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatSessionTime(consultationSession.startedAt)}
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
                  Visit type
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.visitType}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Intake summary
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientDraft.symptoms}
                </dd>
              </div>
            </dl>
          </Card>

          <InfoBanner
            title="Clinician-authored notes remain the source of truth"
            tone="review"
            icon={<ShieldAlert className="h-4 w-4 text-warning" />}
          >
            AI context can help the conversation start faster, but this visit
            note should reflect the physician's own assessment and plan.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-soft text-info">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">Draft handoff available</h3>
                <p className="text-sm text-muted">
                  Use the intake summary as context, then verify it directly
                  with {firstName}.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              Confirm identity, re-state the main complaint in the patient's own
              words, and check danger signs before finalizing the plan.
            </div>
          </Card>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Consultation note
                </p>
                <h3 className="mt-2 text-2xl text-ink">
                  Document the live assessment
                </h3>
              </div>
              <StatusPill tone="review">Draft saved locally</StatusPill>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-brand-soft/50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Chief complaint
              </p>
              <p className="mt-2 text-sm leading-6 text-ink">
                {patientDraft.symptoms}
              </p>
            </div>

            <div className="space-y-5">
              {consultationNoteSections.map((section) => (
                <div key={section.key} className="space-y-2">
                  <label
                    htmlFor={section.key}
                    className="text-sm font-medium text-ink"
                  >
                    {section.label}
                  </label>
                  <Textarea
                    id={section.key}
                    value={consultationDraft[section.key]}
                    onChange={(event) =>
                      updateField(section.key, event.target.value)
                    }
                    placeholder={section.placeholder}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Route after consultation
              </p>
              <h3 className="mt-2 text-2xl text-ink">
                Choose the operational next step
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {consultationNextActions.map((option) => {
                const isSelected = nextAction === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConsultationNextAction(option.value)}
                    className={
                      isSelected
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-4 text-left"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-4 text-left transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    <p className="text-sm font-semibold text-ink">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!canComplete}>
                Complete consultation
                <Stethoscope className="h-4 w-4" />
              </Button>

              <Button variant="secondary" asChild>
                <Link to="/physician/queue">Return to queue</Link>
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
