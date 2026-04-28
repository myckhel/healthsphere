import {
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Stethoscope,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { consultationNextActions } from "@/app/app-content";
import { getConsultation, queryKeys } from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { LoadingPanel } from "@/shared/ui/loading-panel";
import { StatusPill } from "@/shared/ui/status-pill";

const consultationOutcomeSteps = [
  "Loading completed visit",
  "Checking review state",
  "Preparing operational handoff",
] as const;

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
  const { consultationId } = useParams();
  const consultationQuery = useQuery({
    queryKey: consultationId
      ? queryKeys.consultation(consultationId)
      : ["consultation", "missing"],
    queryFn: () => getConsultation(consultationId as string),
    enabled: Boolean(consultationId),
  });

  const consultation = consultationQuery.data;
  const patientSnapshot = consultation?.patientSnapshot;
  const draftPackage = consultation?.draftAssessmentPackage;

  const nextAction = consultationNextActions.find(
    (option) => option.value === consultation?.nextAction,
  );

  if (consultationQuery.isPending) {
    return (
      <LoadingPanel
        title="Loading consultation outcome"
        description="The completed visit summary and next operational handoff are loading now."
        label="Loading"
        steps={consultationOutcomeSteps}
        currentStep={0}
      />
    );
  }

  if (!consultation || consultation.status !== "completed") {
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
            <Link
              to={
                consultationId
                  ? `/physician/consultation/${consultationId}/active`
                  : "/physician/queue"
              }
            >
              Open active consultation
              <Stethoscope className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="secondary" asChild>
            <Link
              to={
                consultationId
                  ? `/physician/consultation/${consultationId}`
                  : "/physician/queue"
              }
            >
              Back to readiness
            </Link>
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
          <h2 className="mt-2 text-3xl text-ink">
            {patientSnapshot?.fullName ?? consultation.patientId}
          </h2>
        </div>

        <Button variant="ghost" asChild>
          <Link to={`/physician/consultation/${consultation.id}`}>
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
                  {consultation.clinicianName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Started at
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatSessionTime(consultation.startedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Completed at
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatSessionTime(consultation.completedAt)}
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
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Review state
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {consultation.clinicianReview.isFinalized
                    ? "Clinician review confirmed"
                    : "Review not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Reviewed by
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {consultation.clinicianReview.reviewedBy || "Not recorded"}
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

            {consultation.clinicianReview.reviewedAt ? (
              <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4 text-sm leading-6 text-muted">
                Final review was recorded at{" "}
                {formatSessionTime(consultation.clinicianReview.reviewedAt)}.
              </div>
            ) : null}
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
              <p>
                {draftPackage?.complaintSummary ||
                  patientSnapshot?.presentingComplaint ||
                  "No complaint note recorded."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Draft package summary</p>
              <p>
                {draftPackage?.assessment ||
                  "No draft assessment package is attached to this visit."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Assessment</p>
              <p>
                {consultation.draftNote?.assessment ||
                  "No assessment has been recorded for this visit yet."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Plan</p>
              <p>
                {consultation.draftNote?.carePlan ||
                  "No plan has been recorded for this visit yet."}
              </p>
            </div>

            <div>
              <p className="font-semibold text-ink">Follow-up instructions</p>
              <p>
                {consultation.draftNote?.followUpInstructions ||
                  "No follow-up instructions have been documented yet."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/physician/queue">Return to queue</Link>
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/physician/dashboard">Prepare next consultation</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
