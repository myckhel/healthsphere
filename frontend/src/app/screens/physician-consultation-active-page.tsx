import {
  ChevronLeft,
  FileText,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  consultationNextActions,
  consultationNoteSections,
} from "@/app/app-content";
import {
  createEmptyConsultationDraft,
  getConsultation,
  getApiErrorMessage,
  listRecords,
  queryKeys,
  regenerateConsultationDraftAssessment,
  updateConsultation,
  type ConsultationNextAction,
  type ConsultationDraftAssessmentPackage,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { Input } from "@/shared/ui/input";
import { LoadingPanel } from "@/shared/ui/loading-panel";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";
import { StepProgress } from "@/shared/ui/step-progress";
import { Textarea } from "@/shared/ui/textarea";

const consultationWorkspaceSteps = [
  "Loading consultation details",
  "Loading record context",
  "Preparing documentation workspace",
] as const;

const consultationSaveSteps = [
  "Saving clinician note",
  "Syncing consultation state",
  "Preparing the next workspace",
] as const;

const labTranslationSteps = [
  "Applying selected lab",
  "Refreshing translated summary",
  "Updating consultation context",
] as const;

const consultationSchema = z.object({
  clinicianName: z.string().trim().min(1, "Clinician name is required."),
  historyOfPresentIllness: z.string(),
  redFlags: z.string(),
  examFindings: z.string(),
  assessment: z.string(),
  carePlan: z.string(),
  followUpInstructions: z.string(),
  nextAction: z.string(),
  finalAssessmentReviewed: z.boolean(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

type AiPrefillSnapshot = {
  historyOfPresentIllness: string;
  assessment: string;
  carePlan: string;
  nextAction: ConsultationNextAction | null;
};

const aiGenerationSteps = [
  "Collecting patient summary",
  "Reviewing prior records",
  "Drafting note scaffold",
] as const;

function hasClinicianAuthoredText(value: string | undefined) {
  return Boolean(value?.trim().length);
}

function normalizeDraftText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function buildAiPrefillSnapshot(
  draftPackage: ConsultationDraftAssessmentPackage | null | undefined,
): AiPrefillSnapshot {
  return {
    historyOfPresentIllness: normalizeDraftText(draftPackage?.subjective),
    assessment: normalizeDraftText(draftPackage?.assessment),
    carePlan: normalizeDraftText(draftPackage?.plan),
    nextAction: draftPackage?.nextActionSuggestion ?? null,
  };
}

function shouldApplyLatestAiValue(
  currentValue: string | undefined,
  previousAiValue: string,
) {
  const normalizedCurrent = normalizeDraftText(currentValue);
  if (!normalizedCurrent) {
    return true;
  }

  return normalizedCurrent === normalizeDraftText(previousAiValue);
}

function buildInitialConsultationDraft(
  draft: ReturnType<typeof createEmptyConsultationDraft> | null | undefined,
  subjective: string | undefined,
  assessment: string | undefined,
  plan: string | undefined,
) {
  const baseDraft = draft ?? createEmptyConsultationDraft();

  return {
    ...baseDraft,
    historyOfPresentIllness: hasClinicianAuthoredText(
      baseDraft.historyOfPresentIllness,
    )
      ? baseDraft.historyOfPresentIllness
      : subjective?.trim() || baseDraft.historyOfPresentIllness,
    assessment: hasClinicianAuthoredText(baseDraft.assessment)
      ? baseDraft.assessment
      : assessment?.trim() || baseDraft.assessment,
    carePlan: hasClinicianAuthoredText(baseDraft.carePlan)
      ? baseDraft.carePlan
      : plan?.trim() || baseDraft.carePlan,
  };
}

function mergeConsultationDraftWithLatestAi(
  draft: ReturnType<typeof createEmptyConsultationDraft>,
  currentValues: ConsultationFormValues,
  previousAi: AiPrefillSnapshot,
  nextAi: AiPrefillSnapshot,
) {
  return {
    ...draft,
    historyOfPresentIllness: shouldApplyLatestAiValue(
      currentValues.historyOfPresentIllness,
      previousAi.historyOfPresentIllness,
    )
      ? nextAi.historyOfPresentIllness || draft.historyOfPresentIllness
      : currentValues.historyOfPresentIllness,
    assessment: shouldApplyLatestAiValue(
      currentValues.assessment,
      previousAi.assessment,
    )
      ? nextAi.assessment || draft.assessment
      : currentValues.assessment,
    carePlan: shouldApplyLatestAiValue(
      currentValues.carePlan,
      previousAi.carePlan,
    )
      ? nextAi.carePlan || draft.carePlan
      : currentValues.carePlan,
  };
}

function resolveNextActionAfterRegeneration(
  currentValue: ConsultationNextAction,
  previousAiValue: ConsultationNextAction | null,
  nextAiValue: ConsultationNextAction | null,
  fallbackValue: ConsultationNextAction | null,
) {
  if (previousAiValue && currentValue === previousAiValue) {
    return nextAiValue ?? fallbackValue ?? currentValue;
  }

  if (!previousAiValue && currentValue === "follow-up-booking") {
    return nextAiValue ?? fallbackValue ?? currentValue;
  }

  return currentValue;
}

function formatSessionTime(value: string | null) {
  if (!value) {
    return "Not started";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not generated yet";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PhysicianConsultationActivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { consultationId } = useParams();
  const setClinicianName = useAppStore((state) => state.setClinicianName);
  const localClinicianName = useAppStore((state) => state.clinicianName);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [labSelectionError, setLabSelectionError] = useState<string | null>(
    null,
  );
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [lastAppliedAiPrefill, setLastAppliedAiPrefill] =
    useState<AiPrefillSnapshot>(buildAiPrefillSnapshot(null));
  const [manualSelectedLabRecordId, setManualSelectedLabRecordId] = useState<
    string | null
  >(null);
  const regenerateFormSnapshotRef = useRef<ConsultationFormValues | null>(null);
  const skipNextConsultationResetRef = useRef(false);

  const consultationQuery = useQuery({
    queryKey: consultationId
      ? queryKeys.consultation(consultationId)
      : ["consultation", "missing"],
    queryFn: () => getConsultation(consultationId as string),
    enabled: Boolean(consultationId),
  });
  const allRecordsQuery = useQuery({
    queryKey: queryKeys.records(consultationQuery.data?.patientId),
    queryFn: () => listRecords(consultationQuery.data?.patientId),
    enabled: Boolean(consultationQuery.data?.patientId),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(
      consultationQuery.data?.patientId,
      undefined,
      "lab",
    ),
    queryFn: () =>
      listRecords(consultationQuery.data?.patientId, undefined, "lab"),
    enabled: Boolean(consultationQuery.data?.patientId),
  });

  const { register, handleSubmit, reset, control, setValue, getValues } =
    useForm<ConsultationFormValues>({
      resolver: zodResolver(consultationSchema),
      defaultValues: {
        clinicianName: localClinicianName,
        ...createEmptyConsultationDraft(),
        nextAction: "follow-up-booking",
        finalAssessmentReviewed: false,
      },
    });

  const consultation = consultationQuery.data;
  const patientSnapshot = consultation?.patientSnapshot;
  const draftPackage = consultation?.draftAssessmentPackage;
  const translatedLabResult = consultation?.translatedLabResult;
  const labRecords = recordsQuery.data ?? [];
  const selectedLabRecordId =
    manualSelectedLabRecordId ??
    consultation?.selectedLabRecord?.recordId ??
    labRecords[0]?.id ??
    null;

  useEffect(() => {
    if (!consultation) {
      return;
    }

    const nextAiPrefill = buildAiPrefillSnapshot(
      consultation.draftAssessmentPackage,
    );

    if (skipNextConsultationResetRef.current) {
      skipNextConsultationResetRef.current = false;
      setLastAppliedAiPrefill(nextAiPrefill);
      return;
    }

    const draft = buildInitialConsultationDraft(
      consultation.draftNote,
      consultation.draftAssessmentPackage?.subjective,
      consultation.draftAssessmentPackage?.assessment,
      consultation.draftAssessmentPackage?.plan,
    );
    reset({
      clinicianName: consultation.clinicianName ?? localClinicianName,
      ...draft,
      nextAction:
        consultation.nextAction ??
        consultation.draftAssessmentPackage?.nextActionSuggestion ??
        "follow-up-booking",
      finalAssessmentReviewed:
        consultation.clinicianReview.isFinalized ?? false,
    });
    setLastAppliedAiPrefill(nextAiPrefill);
    setRegenerateError(null);
  }, [consultation, localClinicianName, reset]);

  const regenerateMutation = useMutation({
    mutationFn: () =>
      regenerateConsultationDraftAssessment(
        consultationId as string,
        selectedLabRecordId ?? undefined,
      ),
    onMutate: () => {
      regenerateFormSnapshotRef.current = getValues();
      setRegenerateError(null);
      setLabSelectionError(null);
      setAiProgressStep(0);
    },
    onSuccess: (updated) => {
      const currentValues = regenerateFormSnapshotRef.current ?? getValues();
      const nextAiPrefill = buildAiPrefillSnapshot(
        updated.draftAssessmentPackage,
      );
      const mergedDraft = mergeConsultationDraftWithLatestAi(
        updated.draftNote ?? createEmptyConsultationDraft(),
        currentValues,
        lastAppliedAiPrefill,
        nextAiPrefill,
      );

      queryClient.setQueryData(queryKeys.consultation(updated.id), updated);
      skipNextConsultationResetRef.current = true;
      setLastAppliedAiPrefill(nextAiPrefill);
      reset({
        ...currentValues,
        clinicianName:
          currentValues.clinicianName ||
          updated.clinicianName ||
          localClinicianName,
        ...mergedDraft,
        nextAction: resolveNextActionAfterRegeneration(
          currentValues.nextAction as ConsultationNextAction,
          lastAppliedAiPrefill.nextAction,
          nextAiPrefill.nextAction,
          updated.nextAction,
        ),
        finalAssessmentReviewed:
          currentValues.finalAssessmentReviewed ||
          updated.clinicianReview.isFinalized,
      });
    },
    onError: (error) => {
      setRegenerateError(
        getApiErrorMessage(error, "Unable to refresh the AI draft right now."),
      );
    },
    onSettled: () => {
      regenerateFormSnapshotRef.current = null;
      setAiProgressStep(0);
    },
  });

  useEffect(() => {
    if (!regenerateMutation.isPending) {
      return;
    }

    const timeouts = [
      setTimeout(() => setAiProgressStep(1), 700),
      setTimeout(() => setAiProgressStep(2), 1500),
    ];

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [regenerateMutation.isPending]);

  const saveMutation = useMutation({
    mutationFn: (values: ConsultationFormValues) =>
      updateConsultation(consultationId as string, {
        clinicianName: values.clinicianName,
        nextAction: values.nextAction as ConsultationNextAction,
        draftNote: {
          historyOfPresentIllness: values.historyOfPresentIllness,
          redFlags: values.redFlags,
          examFindings: values.examFindings,
          assessment: values.assessment,
          carePlan: values.carePlan,
          followUpInstructions: values.followUpInstructions,
        },
        status: "in_progress",
      }),
    onSuccess: async (updated) => {
      setClinicianName(updated.clinicianName ?? localClinicianName);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.consultation(updated.id),
      });
      setSubmitError(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (values: ConsultationFormValues) =>
      updateConsultation(consultationId as string, {
        clinicianName: values.clinicianName,
        nextAction: values.nextAction as ConsultationNextAction,
        draftNote: {
          historyOfPresentIllness: values.historyOfPresentIllness,
          redFlags: values.redFlags,
          examFindings: values.examFindings,
          assessment: values.assessment,
          carePlan: values.carePlan,
          followUpInstructions: values.followUpInstructions,
        },
        status: "completed",
        finalAssessmentReviewed: values.finalAssessmentReviewed,
      }),
    onSuccess: async (updated) => {
      setClinicianName(updated.clinicianName ?? localClinicianName);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.consultation(updated.id),
      });
      navigate(`/physician/consultation/${updated.id}/outcome`);
    },
  });

  const nextAction = useWatch({
    control,
    name: "nextAction",
  }) as ConsultationNextAction;
  const applySelectedLabMutation = useMutation({
    mutationFn: (recordId: string) =>
      updateConsultation(consultationId as string, {
        selectedLabRecordId: recordId,
      }),
    onMutate: () => {
      setLabSelectionError(null);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.consultation(updated.id), updated);
      setManualSelectedLabRecordId(updated.selectedLabRecord?.recordId ?? null);
    },
    onError: (error) => {
      setLabSelectionError(
        getApiErrorMessage(
          error,
          "Unable to attach the selected lab result right now.",
        ),
      );
    },
  });
  const finalAssessmentReviewed = useWatch({
    control,
    name: "finalAssessmentReviewed",
  });
  const assessment = useWatch({ control, name: "assessment" });
  const carePlan = useWatch({ control, name: "carePlan" });
  const canComplete =
    assessment.trim().length >= 12 && carePlan.trim().length >= 12;
  const isAiGenerationActive = regenerateMutation.isPending;
  const redFlagPrompt = draftPackage?.followUpQuestions.length
    ? draftPackage.followUpQuestions[0]
    : "Confirm whether any danger signs, severe worsening, or escalation triggers are present before finalizing the route.";
  const examPrompt = patientSnapshot?.symptoms?.length
    ? `Use the presenting complaint and symptoms (${patientSnapshot.symptoms.join(", ")}) to guide a focused exam, then record only observed findings.`
    : "Use the presenting complaint and record context to guide a focused exam, then record only observed findings.";
  const selectedLabRecord = labRecords.find(
    (record) => record.id === selectedLabRecordId,
  );
  const appliedLabRecordId = consultation?.selectedLabRecord?.recordId ?? null;
  const hasUnappliedLabSelection = Boolean(
    selectedLabRecordId && selectedLabRecordId !== appliedLabRecordId,
  );
  const patientFriendlyLabSummary =
    translatedLabResult?.patientExplanation?.trim();

  if (consultationQuery.isPending) {
    return (
      <LoadingPanel
        title="Loading the active consultation"
        description="The clinician handoff, prior records, and documentation workspace are loading before live note-taking begins."
        label="Loading"
        steps={consultationWorkspaceSteps}
        currentStep={0}
      />
    );
  }

  const insertPatientSummaryIntoFollowUp = () => {
    if (!patientFriendlyLabSummary) {
      return;
    }

    const currentFollowUp = getValues("followUpInstructions").trim();
    const nextFollowUp = currentFollowUp
      ? `${currentFollowUp}\n\nPatient-facing lab summary: ${patientFriendlyLabSummary}`
      : `Patient-facing lab summary: ${patientFriendlyLabSummary}`;

    setValue("followUpInstructions", nextFollowUp, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  if (!consultation || consultation.status !== "in_progress") {
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
            <Link
              to={
                consultationId
                  ? `/physician/consultation/${consultationId}`
                  : "/physician/queue"
              }
            >
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
          <h2 className="mt-2 text-3xl text-ink">
            {patientSnapshot?.fullName ?? consultation.patientId}
          </h2>
        </div>

        <Button variant="ghost" asChild>
          <Link to={`/physician/consultation/${consultation.id}`}>
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
                  {consultation.clinicianName || localClinicianName}
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
                  Date of birth
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatDate(patientSnapshot?.dateOfBirth ?? null)}
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
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Consent status
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {patientSnapshot?.consentStatus || "Not recorded"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Intake summary
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {patientSnapshot?.presentingComplaint ||
                    "No triage complaint found."}
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
                  Use the intake summary and any saved records as context, then
                  verify them directly with{" "}
                  {patientSnapshot?.fullName.split(" ")[0] ?? "the patient"}.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              <p>
                {draftPackage?.assessment ||
                  "No draft assessment package has been generated yet."}
              </p>
              <p>
                {draftPackage?.plan ||
                  "No draft plan is attached yet. Keep the clinician-authored note as the source of truth."}
              </p>
              <p>
                This patient currently has {allRecordsQuery.data?.length ?? 0}{" "}
                saved record(s) and {consultation.retrievedContext.length}{" "}
                retrieved context item(s) available for review.
              </p>
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Lab result context
                </p>
                <h3 className="mt-2 text-2xl text-ink">
                  Select a lab result for AI-assisted translation
                </h3>
              </div>
              <StatusPill tone={translatedLabResult ? "info" : "review"}>
                {translatedLabResult ? "Translation ready" : "Manual selection"}
              </StatusPill>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-line bg-white px-4 py-4">
              {recordsQuery.isPending ? (
                <LoadingPanel
                  title="Loading lab results"
                  description="Saved lab records are syncing so the right result can be attached to this consultation."
                  label="Syncing"
                  steps={labTranslationSteps}
                  currentStep={0}
                  className="border-none bg-brand-soft/20 p-4 shadow-none sm:p-4"
                />
              ) : null}

              {labRecords.length ? (
                <div className="grid gap-3">
                  {labRecords.slice(0, 5).map((record, index) => {
                    const isSelected = record.id === selectedLabRecordId;
                    const isApplied = record.id === appliedLabRecordId;
                    return (
                      <button
                        key={record.id}
                        type="button"
                        className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-brand bg-brand-soft/40"
                            : "border-line bg-white hover:border-brand/40"
                        }`}
                        onClick={() => {
                          setManualSelectedLabRecordId(record.id);
                          setLabSelectionError(null);
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {record.title}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                              {index === 0
                                ? "Latest saved lab"
                                : "Saved lab result"}
                              {isApplied ? " • applied to consultation" : ""}
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted">
                            <p>{formatDate(record.createdAt)}</p>
                            <p>{record.reviewStatus}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  No saved lab results are available for this patient yet. The
                  consultation can continue with the general retrieved context.
                </p>
              )}

              {labRecords.length ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-brand-soft/30 px-4 py-3 text-sm text-muted">
                  <p>
                    {hasUnappliedLabSelection
                      ? "Apply the selected lab result to refresh the translated summary now, or regenerate the AI draft to use it directly."
                      : appliedLabRecordId
                        ? "The applied lab result is currently informing the consultation support workspace."
                        : "The latest lab result is preselected. Apply it when you want the translation panel to refresh immediately."}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      !selectedLabRecordId ||
                      !hasUnappliedLabSelection ||
                      applySelectedLabMutation.isPending
                    }
                    onClick={() => {
                      if (selectedLabRecordId) {
                        applySelectedLabMutation.mutate(selectedLabRecordId);
                      }
                    }}
                  >
                    {applySelectedLabMutation.isPending
                      ? "Applying selected lab..."
                      : "Apply selected lab result"}
                  </Button>
                </div>
              ) : null}

              {labSelectionError ? (
                <InfoBanner
                  title="Unable to use selected lab result"
                  tone="review"
                >
                  {labSelectionError}
                </InfoBanner>
              ) : null}
            </div>

            <Card className="space-y-4 border border-line/80 bg-white/95">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Clinician panel
                  </p>
                  <h4 className="mt-2 text-xl text-ink">
                    Lab interpretation for clinician review
                  </h4>
                </div>
                <StatusPill tone="review">Decision support only</StatusPill>
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-line bg-white px-4 py-4 text-sm leading-6 text-muted">
                <div>
                  <p className="font-semibold text-ink">Clinician summary</p>
                  <p>
                    {translatedLabResult?.clinicianSummary ||
                      (selectedLabRecord
                        ? "Apply the selected lab result or regenerate the AI draft to translate it into clinician support context."
                        : "Select a lab result to generate a translated summary for this consultation.")}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-ink">Key observations</p>
                  <p>
                    {translatedLabResult?.keyObservations.length
                      ? translatedLabResult.keyObservations
                          .map((item) => {
                            const unit = item.unit ? ` ${item.unit}` : "";
                            const flag = item.flag ? ` (${item.flag})` : "";
                            return `${item.name}: ${item.value}${unit}${flag}`;
                          })
                          .join(" • ")
                      : "No structured lab observations are attached yet."}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-ink">
                    Abnormal or notable findings
                  </p>
                  <p>
                    {translatedLabResult?.abnormalFindings.length
                      ? translatedLabResult.abnormalFindings.join(" ")
                      : "No abnormal findings have been highlighted yet. Confirm directly with the raw report."}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-ink">
                    Recommended clinician actions
                  </p>
                  <p>
                    {translatedLabResult?.recommendedClinicianActions.length
                      ? translatedLabResult.recommendedClinicianActions.join(
                          " ",
                        )
                      : "Recommended clinician actions will appear once a translated lab result is available."}
                  </p>
                </div>

                {translatedLabResult?.escalationNote ? (
                  <InfoBanner title="Potential escalation flag" tone="review">
                    {translatedLabResult.escalationNote}
                  </InfoBanner>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-4 border border-line/80 bg-white/95">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Patient panel
                  </p>
                  <h4 className="mt-2 text-xl text-ink">
                    Patient-facing lab summary
                  </h4>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!patientFriendlyLabSummary}
                  onClick={insertPatientSummaryIntoFollowUp}
                >
                  Insert into follow-up instructions
                </Button>
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-line bg-white px-4 py-4 text-sm leading-6 text-muted">
                <div>
                  <p className="font-semibold text-ink">
                    Patient-friendly explanation
                  </p>
                  <p>
                    {patientFriendlyLabSummary ||
                      "A patient-friendly explanation will appear here after a lab result is applied to the consultation."}
                  </p>
                </div>

                <InfoBanner title="Use after clinician review" tone="review">
                  This summary supports the patient conversation. Confirm the
                  lab values and the clinical meaning before sharing or
                  documenting it in the final instructions.
                </InfoBanner>
              </div>
            </Card>
          </Card>

          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Full AI draft package
                </p>
                <h3 className="mt-2 text-2xl text-ink">
                  Review the generated scaffold while documenting
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={isAiGenerationActive ? "info" : "review"}>
                  {isAiGenerationActive ? "Generating" : "Draft only"}
                </StatusPill>
                {draftPackage ? (
                  <StatusPill tone="neutral">
                    {draftPackage.source === "agent"
                      ? "Agent generated"
                      : "Fallback draft"}
                  </StatusPill>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-white px-4 py-4 text-sm text-muted">
              <div className="space-y-1">
                <p className="font-semibold text-ink">AI draft status</p>
                <p>
                  Generated {formatDateTime(draftPackage?.generatedAt)}. Review
                  before relying on any suggested assessment, plan, or next
                  action.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={
                  isAiGenerationActive ||
                  applySelectedLabMutation.isPending ||
                  saveMutation.isPending ||
                  completeMutation.isPending
                }
                onClick={() => regenerateMutation.mutate()}
              >
                <RefreshCw
                  className={
                    isAiGenerationActive ? "h-4 w-4 animate-spin" : "h-4 w-4"
                  }
                />
                {draftPackage ? "Regenerate AI draft" : "Generate AI draft"}
              </Button>
            </div>

            {isAiGenerationActive ? (
              <div className="space-y-4 rounded-[1.5rem] border border-info/15 bg-info-soft/70 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    AI-assisted note is refreshing
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink/80">
                    The physician draft stays editable while the latest context
                    is reviewed. Existing clinician-authored note text will be
                    preserved.
                  </p>
                </div>

                <StepProgress
                  steps={aiGenerationSteps}
                  currentStep={aiProgressStep}
                />
              </div>
            ) : null}

            {regenerateError ? (
              <InfoBanner title="Unable to refresh AI draft" tone="review">
                {regenerateError}
              </InfoBanner>
            ) : null}

            {applySelectedLabMutation.isPending ? (
              <LoadingPanel
                title="Refreshing lab translation"
                description="The selected lab result is being attached to this consultation and the translated guidance is updating now."
                label="Applying"
                steps={labTranslationSteps}
                currentStep={1}
                className="border-brand/15 bg-brand-soft/20"
              />
            ) : null}

            <div className="space-y-4 rounded-[1.5rem] border border-line bg-white px-4 py-4 text-sm leading-6 text-muted">
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
                  {draftPackage?.subjective ||
                    "No subjective draft is attached yet."}
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
                <p className="font-semibold text-ink">Selected lab result</p>
                <p>
                  {consultation.selectedLabRecord
                    ? `${consultation.selectedLabRecord.title} • ${formatDate(consultation.selectedLabRecord.createdAt)}`
                    : "No lab result has been applied to the consultation yet."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">Draft plan</p>
                <p>{draftPackage?.plan || "No draft plan is attached yet."}</p>
              </div>

              <div>
                <p className="font-semibold text-ink">Suggested next action</p>
                <p>
                  {consultationNextActions.find(
                    (option) =>
                      option.value === draftPackage?.nextActionSuggestion,
                  )?.label || "No suggested next step from the draft package."}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink">AI prompts to verify</p>
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
          </Card>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(() => undefined)}>
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
              <StatusPill tone="review">Draft saved to backend</StatusPill>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-brand-soft/50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Chief complaint
              </p>
              <p className="mt-2 text-sm leading-6 text-ink">
                {draftPackage?.complaintSummary ||
                  patientSnapshot?.presentingComplaint ||
                  "No complaint captured."}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="clinicianName"
                className="text-sm font-medium text-ink"
              >
                Clinician name
              </label>
              <Input id="clinicianName" {...register("clinicianName")} />
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
                    {...register(section.key)}
                    placeholder={section.placeholder}
                  />

                  {section.key === "redFlags" ? (
                    <div className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
                      <p className="font-semibold text-ink">AI prompt only</p>
                      <p>{redFlagPrompt}</p>
                    </div>
                  ) : null}

                  {section.key === "examFindings" ? (
                    <div className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
                      <p className="font-semibold text-ink">AI prompt only</p>
                      <p>{examPrompt}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {submitError ? (
              <InfoBanner
                title="Consultation note needs attention"
                tone="review"
              >
                {submitError}
              </InfoBanner>
            ) : null}

            {saveMutation.isError ? (
              <InfoBanner title="Unable to save draft" tone="review">
                {getApiErrorMessage(saveMutation.error)}
              </InfoBanner>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSubmit((values) => saveMutation.mutate(values))}
                disabled={saveMutation.isPending || isAiGenerationActive}
              >
                {saveMutation.isPending ? "Saving note..." : "Save note draft"}
              </Button>
            </div>

            {saveMutation.isPending ? (
              <LoadingPanel
                title="Saving the clinician note"
                description="The draft note is being stored now so the active consultation stays in sync across the workflow."
                label="Saving"
                steps={consultationSaveSteps}
                currentStep={1}
                className="border-brand/15 bg-brand-soft/20"
              />
            ) : null}
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
                    onClick={() => setValue("nextAction", option.value)}
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

            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-line text-brand"
                  {...register("finalAssessmentReviewed")}
                />
                <span className="space-y-1 text-sm leading-6 text-muted">
                  <span className="block font-medium text-ink">
                    I have reviewed the final assessment and care plan.
                  </span>
                  <span className="block">
                    Completion now requires explicit clinician review so the
                    final note and operational next step are clearly owned.
                  </span>
                </span>
              </label>
            </div>

            {consultation.clinicianReview.isFinalized ? (
              <InfoBanner
                title="Final assessment already reviewed"
                tone="success"
              >
                Reviewed by{" "}
                {consultation.clinicianReview.reviewedBy || "the clinician"} at{" "}
                {formatSessionTime(consultation.clinicianReview.reviewedAt)}.
              </InfoBanner>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={
                  !canComplete ||
                  !finalAssessmentReviewed ||
                  completeMutation.isPending ||
                  isAiGenerationActive
                }
                onClick={handleSubmit((values) => {
                  if (!canComplete) {
                    setSubmitError(
                      "Assessment and plan are required before the consultation can be completed.",
                    );
                    return;
                  }
                  if (!values.finalAssessmentReviewed) {
                    setSubmitError(
                      "Explicit clinician review is required before the consultation can be completed.",
                    );
                    return;
                  }
                  setSubmitError(null);
                  completeMutation.mutate(values);
                })}
              >
                {completeMutation.isPending
                  ? "Completing consultation..."
                  : "Complete consultation"}
                <Stethoscope className="h-4 w-4" />
              </Button>

              <Button variant="secondary" asChild>
                <Link to="/physician/queue">Return to queue</Link>
              </Button>
            </div>

            {completeMutation.isError ? (
              <InfoBanner title="Unable to complete consultation" tone="review">
                {getApiErrorMessage(completeMutation.error)}
              </InfoBanner>
            ) : null}

            {completeMutation.isPending ? (
              <LoadingPanel
                title="Completing the consultation"
                description="The final note, review state, and next action are being saved before the outcome handoff opens."
                label="Completing"
                steps={consultationSaveSteps}
                currentStep={2}
                className="border-brand/15 bg-brand-soft/20"
              />
            ) : null}
          </Card>
        </form>
      </div>
    </div>
  );
}
