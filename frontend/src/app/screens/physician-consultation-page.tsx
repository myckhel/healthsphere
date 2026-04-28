import { ChevronLeft, FileText, ShieldAlert, Stethoscope } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { consultationNextActions } from "@/app/app-content";
import {
  getConsultation,
  listRecords,
  queryKeys,
  updateConsultation,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { LoadingPanel } from "@/shared/ui/loading-panel";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

const consultationStartSteps = [
  "Loading patient handoff",
  "Checking record context",
  "Preparing the consultation workspace",
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleDateString();
}

export function PhysicianConsultationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { consultationId } = useParams();
  const setActiveConsultationId = useAppStore(
    (state) => state.setActiveConsultationId,
  );
  const clinicianName = useAppStore((state) => state.clinicianName);

  const consultationQuery = useQuery({
    queryKey: consultationId
      ? queryKeys.consultation(consultationId)
      : ["consultation", "missing"],
    queryFn: () => getConsultation(consultationId as string),
    enabled: Boolean(consultationId),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(consultationQuery.data?.patientId),
    queryFn: () => listRecords(consultationQuery.data?.patientId),
    enabled: Boolean(consultationQuery.data?.patientId),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) =>
      updateConsultation(id, {
        clinicianName,
        status: "in_progress",
      }),
    onSuccess: async (consultation) => {
      setActiveConsultationId(consultation.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.consultation(consultation.id),
      });
      navigate(`/physician/consultation/${consultation.id}/active`);
    },
  });

  const consultation = consultationQuery.data;
  const patientSnapshot = consultation?.patientSnapshot;
  const draftPackage = consultation?.draftAssessmentPackage;
  const nextActionSuggestion = consultationNextActions.find(
    (option) => option.value === draftPackage?.nextActionSuggestion,
  );
  const firstName = patientSnapshot?.fullName.split(" ")[0] ?? "the patient";

  if (consultationQuery.isPending) {
    return (
      <LoadingPanel
        title="Loading consultation readiness"
        description="The patient handoff, draft note, and record context are loading before the consultation workspace opens."
        label="Loading"
        steps={consultationStartSteps}
        currentStep={0}
      />
    );
  }

  if (!consultationId || consultationQuery.isError || !consultation) {
    return (
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Consultation workspace
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Open a consultation from the physician queue first.
          </h2>
        </div>

        <p className="text-sm leading-6 text-muted">
          This screen needs a consultation ID from the live queue. Choose a
          patient from the physician queue to create or resume the correct
          session.
        </p>

        <Button asChild>
          <Link to="/physician/queue">Back to queue</Link>
        </Button>
      </Card>
    );
  }

  const sessionTone =
    consultation.status === "in_progress"
      ? "info"
      : consultation.status === "completed"
        ? "review"
        : "success";

  const sessionLabel =
    consultation.status === "in_progress"
      ? "Consultation in progress"
      : consultation.status === "completed"
        ? "Consultation completed"
        : "Consultation ready";

  function handleConsultationAction() {
    if (!consultation) {
      return;
    }

    if (consultation.status === "completed") {
      navigate(`/physician/consultation/${consultation.id}/outcome`);
      return;
    }

    if (consultation.status === "in_progress") {
      navigate(`/physician/consultation/${consultation.id}/active`);
      return;
    }

    startMutation.mutate(consultation.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Consultation workspace
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            {patientSnapshot?.fullName ?? consultation.patientId}
          </h2>
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
                  {patientSnapshot?.externalId || "No external ID supplied"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Date of birth
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatDate(patientSnapshot?.dateOfBirth ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientSnapshot?.phoneNumber || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit type
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientSnapshot?.recommendedQueue || "General consultation"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Urgency
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientSnapshot?.urgencyLevel || "routine"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Symptoms captured
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientSnapshot?.symptoms.length
                    ? patientSnapshot.symptoms.join(", ")
                    : "No symptoms captured from triage yet."}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Patient summary
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientSnapshot?.presentingComplaint ||
                    "No triage complaint found."}
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
                Confirm the existing patient ID or assign a new one so the visit
                can be linked to historical clinic records.
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
                  Generated from triage intake, retrieved record context, and a
                  draft assessment package that still requires clinician review
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5 text-sm leading-6 text-muted">
              <div>
                <p className="font-semibold text-ink">Chief concern</p>
                <p>
                  {draftPackage?.complaintSummary ||
                    patientSnapshot?.presentingComplaint ||
                    "No complaint captured."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Subjective draft</p>
                <p>
                  {recordsQuery.isPending
                    ? "Record context is still loading for this patient."
                    : draftPackage?.subjective ||
                      `${firstName} is linked to ${recordsQuery.data?.length ?? 0} saved record(s). Confirm the complaint directly with the patient before documenting a final assessment.`}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Draft assessment</p>
                <p>
                  {draftPackage?.assessment ||
                    "No draft assessment package has been generated yet."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Draft plan</p>
                <p>{draftPackage?.plan || "No draft plan captured yet."}</p>
              </div>

              <div>
                <p className="font-semibold text-ink">Suggested next action</p>
                <p>
                  {nextActionSuggestion?.label ||
                    "No suggested next step from the draft package."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Follow-up questions</p>
                <p>
                  {draftPackage?.followUpQuestions.length
                    ? draftPackage.followUpQuestions.join(" ")
                    : "No follow-up prompts were generated."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Retrieved context</p>
                <p>
                  {consultation.retrievedContext.length
                    ? consultation.retrievedContext
                        .slice(0, 3)
                        .map((item) => `${item.title}: ${item.snippet}`)
                        .join(" ")
                    : "No reviewed record context is attached yet."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleConsultationAction}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending
                ? "Opening consultation..."
                : consultation.status === "in_progress"
                  ? "Resume consultation"
                  : consultation.status === "completed"
                    ? "Review outcome"
                    : "Start consultation"}
              <Stethoscope className="h-4 w-4" />
            </Button>

            <Button variant="secondary" asChild>
              <Link to="/physician/queue">Return to queue</Link>
            </Button>
          </div>

          {startMutation.isPending ? (
            <LoadingPanel
              title="Opening the consultation"
              description="The clinician session is being marked in progress so the active workspace opens against the live visit."
              label="Opening"
              steps={consultationStartSteps}
              currentStep={2}
              className="border-brand/15 bg-brand-soft/20"
            />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
