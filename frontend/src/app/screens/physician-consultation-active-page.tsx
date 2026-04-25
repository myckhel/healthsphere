import { ChevronLeft, FileText, ShieldAlert, Stethoscope } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  listPatients,
  listRecords,
  listTriageCases,
  queryKeys,
  updateConsultation,
  type ConsultationNextAction,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";
import { Textarea } from "@/shared/ui/textarea";

const consultationSchema = z.object({
  clinicianName: z.string().trim().min(1, "Clinician name is required."),
  historyOfPresentIllness: z.string(),
  redFlags: z.string(),
  examFindings: z.string(),
  assessment: z.string(),
  carePlan: z.string(),
  followUpInstructions: z.string(),
  nextAction: z.string(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

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
  const queryClient = useQueryClient();
  const { consultationId } = useParams();
  const setClinicianName = useAppStore((state) => state.setClinicianName);
  const localClinicianName = useAppStore((state) => state.clinicianName);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const consultationQuery = useQuery({
    queryKey: consultationId
      ? queryKeys.consultation(consultationId)
      : ["consultation", "missing"],
    queryFn: () => getConsultation(consultationId as string),
    enabled: Boolean(consultationId),
  });
  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(),
    queryFn: () => listPatients(),
  });
  const triageCasesQuery = useQuery({
    queryKey: queryKeys.triageCases,
    queryFn: listTriageCases,
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(consultationQuery.data?.patientId),
    queryFn: () => listRecords(consultationQuery.data?.patientId),
    enabled: Boolean(consultationQuery.data?.patientId),
  });

  const { register, handleSubmit, reset, control, setValue } =
    useForm<ConsultationFormValues>({
      resolver: zodResolver(consultationSchema),
      defaultValues: {
        clinicianName: localClinicianName,
        ...createEmptyConsultationDraft(),
        nextAction: "follow-up-booking",
      },
    });

  const consultation = consultationQuery.data;
  const patient = patientsQuery.data?.find(
    (item) => item.id === consultation?.patientId,
  );
  const triageCase = triageCasesQuery.data?.find(
    (item) => item.id === consultation?.triageCaseId,
  );

  useEffect(() => {
    if (!consultation) {
      return;
    }

    const draft = consultation.draftNote ?? createEmptyConsultationDraft();
    reset({
      clinicianName: consultation.clinicianName ?? localClinicianName,
      ...draft,
      nextAction: consultation.nextAction ?? "follow-up-booking",
    });
  }, [consultation, localClinicianName, reset]);

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
  const assessment = useWatch({ control, name: "assessment" });
  const carePlan = useWatch({ control, name: "carePlan" });
  const canComplete =
    assessment.trim().length >= 12 && carePlan.trim().length >= 12;

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
            {patient
              ? `${patient.firstName} ${patient.lastName}`
              : consultation.patientId}
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
                  Preferred language
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {useAppStore.getState().patientDraft.preferredLanguage}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Visit type
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {triageCase?.recommendedQueue || "General consultation"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                  Intake summary
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted">
                  {triageCase?.presentingComplaint ||
                    "No triage complaint found."}
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
                  {patient?.firstName ?? "the patient"}.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              Confirm identity, re-state the complaint in the patient's own
              words, and check danger signs before finalizing the plan. This
              patient currently has {recordsQuery.data?.length ?? 0} saved
              record(s) available for review.
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
                {triageCase?.presentingComplaint || "No complaint captured."}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="clinicianName"
                className="text-sm font-medium text-ink"
              >
                Clinician name
              </label>
              <input
                id="clinicianName"
                {...register("clinicianName")}
                className="h-12 w-full rounded-field border border-line bg-white px-4 text-ink outline-none"
              />
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
                disabled={saveMutation.isPending}
              >
                Save note draft
              </Button>
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={!canComplete || completeMutation.isPending}
                onClick={handleSubmit((values) => {
                  if (!canComplete) {
                    setSubmitError(
                      "Assessment and plan are required before the consultation can be completed.",
                    );
                    return;
                  }
                  setSubmitError(null);
                  completeMutation.mutate(values);
                })}
              >
                Complete consultation
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
          </Card>
        </form>
      </div>
    </div>
  );
}
