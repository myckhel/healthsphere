import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { patientFlowSteps } from "@/app/app-content";
import {
  listConsultations,
  listTriageQueue,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { LoadingPanel } from "@/shared/ui/loading-panel";
import { StepProgress } from "@/shared/ui/step-progress";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

const visitStatusSteps = [
  "Checking queue status",
  "Checking consultation updates",
  "Preparing patient next steps",
] as const;

function formatVisitTime(value: string | null) {
  if (!value) {
    return "Not recorded yet";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPatientNextStep(nextAction: string | null | undefined) {
  switch (nextAction) {
    case "follow-up-booking":
      return {
        label: "Book a follow-up visit",
        description:
          "The clinic team will guide you on when to come back for another visit.",
      };
    case "nurse-handoff":
      return {
        label: "See the nurse",
        description:
          "A nurse will help you with the next part of your care today.",
      };
    case "referral":
      return {
        label: "Referral needed",
        description:
          "The clinic will guide you to another clinician or service for more care.",
      };
    case "discharge":
      return {
        label: "Go home with advice",
        description:
          "You can leave after receiving care advice and knowing when to return.",
      };
    default:
      return {
        label: "Waiting for the next update",
        description:
          "The clinic team will let you know the next step for your visit.",
      };
  }
}

export function PatientNextStepsPage() {
  const patientDraft = useAppStore((state) => state.patientDraft);
  const selectedPatientId = useAppStore((state) => state.selectedPatientId);
  const selectedTriageCaseId = useAppStore(
    (state) => state.selectedTriageCaseId,
  );

  const queueQuery = useQuery({
    queryKey: queryKeys.triageQueue,
    queryFn: listTriageQueue,
    refetchInterval: 15000,
  });
  const queueItem = queueQuery.data?.find(
    (item) => item.triageCaseId === selectedTriageCaseId,
  );
  const patientIdForConsultations = selectedPatientId ?? queueItem?.patientId;

  const consultationsQuery = useQuery({
    queryKey: queryKeys.consultations(patientIdForConsultations ?? undefined),
    queryFn: () => listConsultations(patientIdForConsultations ?? undefined),
    enabled: Boolean(patientIdForConsultations),
    refetchInterval: 15000,
  });

  const queuePosition = queueQuery.data
    ? queueQuery.data.findIndex(
        (item) => item.triageCaseId === selectedTriageCaseId,
      ) + 1
    : 0;
  const consultation = (consultationsQuery.data ?? []).find(
    (item) => item.triageCaseId === selectedTriageCaseId,
  );
  const isVisitInProgress = consultation?.status === "in_progress";
  const isVisitCompleted = consultation?.status === "completed";
  const statusTone = isVisitCompleted
    ? "success"
    : isVisitInProgress
      ? "info"
      : "review";
  const statusLabel = isVisitCompleted
    ? "Visit finished"
    : isVisitInProgress
      ? "With clinician"
      : "Waiting to be seen";
  const statusTitle = isVisitCompleted
    ? "Your visit is complete."
    : isVisitInProgress
      ? "You are now with the clinic team."
      : "You are in line to be seen.";
  const bannerTitle = isVisitCompleted
    ? "Visit update"
    : isVisitInProgress
      ? "You are being seen"
      : "You are checked in";
  const bannerBody = isVisitCompleted
    ? "Your visit has been finished. Please check the next step and care instructions below before leaving."
    : isVisitInProgress
      ? "A clinician has started your visit. Stay nearby and wait for instructions from the clinic team."
      : "Your details have been received by the clinic. Please wait while the team prepares for your visit.";
  const nextStep = getPatientNextStep(consultation?.nextAction);
  const careInstructions =
    consultation?.draftNote?.followUpInstructions?.trim();

  if (!selectedTriageCaseId) {
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Visit status
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Start your visit before checking for updates.
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted">
          Return to the symptom form and tell the clinic what is bothering you
          first.
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

  if (
    (queueQuery.isPending && !queueQuery.data) ||
    (Boolean(patientIdForConsultations) &&
      consultationsQuery.isPending &&
      !consultationsQuery.data)
  ) {
    return (
      <LoadingPanel
        title="Loading visit updates"
        description="The clinic is syncing queue position and consultation status so the patient sees the right next step."
        label="Syncing"
        steps={visitStatusSteps}
        currentStep={1}
      />
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
                Visit status
              </p>
              <h2 className="mt-2 text-3xl text-ink">{statusTitle}</h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/patient/intake">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <InfoBanner
            title={bannerTitle}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          >
            {bannerBody}
          </InfoBanner>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Your place in line
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {queuePosition > 0
                  ? String(queuePosition).padStart(2, "0")
                  : "--"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {isVisitCompleted
                  ? "Your queue wait is finished."
                  : isVisitInProgress
                    ? "You have already been called in."
                    : "The clinic will call you when it is your turn."}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Current step
              </p>
              <div className="mt-2">
                <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-muted">
                {isVisitCompleted
                  ? "Your visit has been completed by the clinic team."
                  : isVisitInProgress
                    ? "The clinic team is speaking with you now."
                    : queueItem
                      ? `About ${queueItem.waitMinutes} min estimated wait.`
                      : "The clinic is updating your wait time."}
              </p>
            </div>
          </div>

          <Card className="bg-white/85 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit details
                </p>
                <h3 className="mt-2 text-xl text-ink">
                  {`${patientDraft.firstName} ${patientDraft.lastName}`.trim()}
                </h3>
              </div>
              <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient ID
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
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Clinician
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {consultation?.clinicianName ||
                    "The clinic will update this when your visit starts"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit started
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatVisitTime(consultation?.startedAt ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit finished
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatVisitTime(consultation?.completedAt ?? null)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Symptoms shared
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {queueItem?.visitReason ??
                    "Your symptom summary is still being prepared."}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Next step
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  <span className="font-medium text-ink">
                    {nextStep.label}.{" "}
                  </span>
                  {nextStep.description}
                </dd>
              </div>
              {isVisitCompleted && careInstructions ? (
                <div className="sm:col-span-2 rounded-[1.25rem] bg-brand-soft/60 px-4 py-4 text-sm leading-6 text-muted">
                  <p className="font-medium text-ink">Care instructions</p>
                  <p className="mt-2">{careInstructions}</p>
                </div>
              ) : null}
              {!patientDraft.externalId && !isVisitCompleted ? (
                <div className="sm:col-span-2 rounded-[1.25rem] bg-brand-soft/60 px-4 py-4 text-sm leading-6 text-muted">
                  The clinic can still continue without an existing patient ID,
                  but staff may ask for one later to match your records.
                </div>
              ) : null}
            </dl>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" asChild>
              <Link to="/patient/intake">Update symptoms</Link>
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/">Return home</Link>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            What patients should know
          </p>
          <h3 className="text-2xl text-ink">
            Clear updates make waiting easier.
          </h3>
          <p className="text-sm leading-6 text-muted">
            This page shows the simple updates a clinic would usually share with
            you while you wait and after your visit is finished.
          </p>
          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              Stay nearby after checking in so staff can call you when it is
              your turn.
            </div>
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              Tell staff immediately if your symptoms get worse while you are
              waiting.
            </div>
            <div className="rounded-[1.5rem] bg-white/75 px-4 py-4 text-sm text-muted">
              Keep your phone, clinic card, or ID ready in case the team needs
              to confirm your details.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
