import {
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { consultationNextActions } from "@/app/prototype-content";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

function formatSessionTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhysicianConsultationOutcomePage() {
  const patientDraft = useAppStore((state) => state.patientDraft);
  const consultationSession = useAppStore((state) => state.consultationSession);
  const consultationDraft = useAppStore((state) => state.consultationDraft);
  const resetConsultationSession = useAppStore(
    (state) => state.resetConsultationSession,
  );

  const nextAction = consultationNextActions.find(
    (option) => option.value === consultationSession.nextAction,
  );

  if (consultationSession.status !== "completed") {
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Consultation outcome
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Complete the consultation before routing the next action.
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted">
          The operational handoff appears here after the physician finishes the
          assessment and confirms the plan.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/physician/consultation/active">
              Open active consultation
              <Stethoscope className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="secondary" asChild>
            <Link to="/physician/consultation">Back to readiness</Link>
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
            Consultation outcome
          </p>
          <h2 className="mt-2 text-3xl text-ink">{patientDraft.fullName}</h2>
        </div>

        <Button variant="ghost" asChild>
          <Link to="/physician/consultation">
            <ChevronLeft className="h-4 w-4" />
            Back to consultation
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit status
                </p>
                <h3 className="mt-2 text-2xl text-ink">Ready for routing</h3>
              </div>
              <StatusPill tone="success">Completed</StatusPill>
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
                  Completed at
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatSessionTime(consultationSession.completedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Next action
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {nextAction?.label ?? "Follow-up review"}
                </dd>
              </div>
            </dl>
          </Card>

          <InfoBanner
            title="Operational handoff stays explicit"
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          >
            The consultation outcome should route the patient to a clear next
            step instead of sending them back into an ambiguous queue.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">Next operational move</h3>
                <p className="text-sm text-muted">
                  {nextAction?.description ??
                    "Route this patient to the most appropriate follow-up step."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              Keep the physician-authored plan attached to the visit so
              follow-up, referral, or discharge instructions stay consistent
              with the final assessment.
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Clinician summary
            </p>
            <h3 className="mt-2 text-2xl text-ink">
              Finalized visit draft for handoff
            </h3>
          </div>

          <div className="space-y-4 text-sm leading-6 text-muted">
            <div>
              <p className="font-semibold text-ink">Chief complaint</p>
              <p>{patientDraft.symptoms}</p>
            </div>

            <div>
              <p className="font-semibold text-ink">Assessment</p>
              <p>
                {consultationDraft.assessment ||
                  "No assessment has been recorded for this prototype visit yet."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Plan</p>
              <p>
                {consultationDraft.carePlan ||
                  "No plan has been recorded for this prototype visit yet."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Follow-up instructions</p>
              <p>
                {consultationDraft.followUpInstructions ||
                  "No follow-up instructions have been documented yet."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/physician/queue">Return to queue</Link>
            </Button>

            <Button
              variant="secondary"
              onClick={resetConsultationSession}
              asChild
            >
              <Link to="/physician/consultation">
                Prepare next consultation
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
