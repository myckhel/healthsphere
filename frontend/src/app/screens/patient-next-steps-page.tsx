import { CheckCircle2, ChevronLeft, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { patientFlowSteps } from "@/app/app-content";
import { listTriageQueue, queryKeys } from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StepProgress } from "@/shared/ui/step-progress";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

export function PatientNextStepsPage() {
  const patientDraft = useAppStore((state) => state.patientDraft);
  const selectedTriageCaseId = useAppStore(
    (state) => state.selectedTriageCaseId,
  );
  const queueQuery = useQuery({
    queryKey: queryKeys.triageQueue,
    queryFn: listTriageQueue,
  });

  const queueItem = queueQuery.data?.find(
    (item) => item.triageCaseId === selectedTriageCaseId,
  );
  const queuePosition = queueQuery.data
    ? queueQuery.data.findIndex(
        (item) => item.triageCaseId === selectedTriageCaseId,
      ) + 1
    : 0;

  if (!selectedTriageCaseId) {
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Queue confirmation
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Create a triage case before checking queue placement.
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted">
          The queue page reflects a real backend triage case. Return to intake
          and submit the symptom form first.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/patient/intake">Return to intake</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/patient/onboarding">Back to onboarding</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={2} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Visit confirmation
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                You are ready for the clinic handoff.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/patient/intake">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <InfoBanner
            title="What happens next"
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          >
            The triage case has been saved to the backend queue. Staff and
            physicians will see the same queue placement shown here.
          </InfoBanner>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Queue
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {queuePosition > 0
                  ? String(queuePosition).padStart(2, "0")
                  : "--"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {queueItem?.recommendedQueue ?? "Awaiting queue refresh"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Estimated wait
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {queueItem ? `${queueItem.waitMinutes} min` : "--"}
              </p>
              <p className="mt-2 text-sm text-muted">
                A clinician will review your symptoms before speaking with you.
              </p>
            </div>
          </div>

          <Card className="bg-white/85 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit summary
                </p>
                <h3 className="mt-2 text-xl text-ink">
                  {`${patientDraft.firstName} ${patientDraft.lastName}`.trim()}
                </h3>
              </div>
              <StatusPill tone="review">Awaiting physician review</StatusPill>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient ID status
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientDraft.externalId || "No existing ID supplied"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Language
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
                  Symptoms shared
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {queueItem?.visitReason ??
                    "Queue is still refreshing the triage summary."}
                </dd>
              </div>
              {!patientDraft.externalId ? (
                <div className="sm:col-span-2 rounded-[1.25rem] bg-brand-soft/60 px-4 py-4 text-sm leading-6 text-muted">
                  Staff can still continue without an existing patient
                  identifier, but duplicate checks are easiest when the clinic
                  ID is entered during onboarding.
                </div>
              ) : null}
            </dl>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/physician/queue">
                Open physician handoff
                <Stethoscope className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/">Return home</Link>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Patient reassurance
          </p>
          <h3 className="text-2xl text-ink">
            Clear next steps reduce uncertainty.
          </h3>
          <p className="text-sm leading-6 text-muted">
            Instead of ending with a vague confirmation, this screen shows the
            queue item created from the real triage case and gives staff a
            consistent handoff point.
          </p>
          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              Bring this screen to the reception desk if staff need to confirm
              your place in the queue.
            </div>
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              If symptoms worsen while waiting, the care team should escalate to
              a clinician immediately.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
