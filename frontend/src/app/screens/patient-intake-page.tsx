import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  MessageSquareText,
  MicOff,
  ShieldAlert,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  patientFlowSteps,
  symptomDurations,
  urgencyOptions,
} from "@/app/app-content";
import {
  createTriageCase,
  getApiErrorMessage,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StepProgress } from "@/shared/ui/step-progress";
import { Textarea } from "@/shared/ui/textarea";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

const intakeSchema = z.object({
  presentingComplaint: z
    .string()
    .trim()
    .min(12, "Please capture the main complaint in the patient's own words."),
  symptomDuration: z.string().trim().min(1),
  symptomsText: z
    .string()
    .trim()
    .min(3, "List at least one symptom or keyword."),
  urgencyLevel: z.string().trim().min(1),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export function PatientIntakePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const intakeDraft = useAppStore((state) => state.intakeDraft);
  const updateIntakeDraft = useAppStore((state) => state.updateIntakeDraft);
  const selectedPatientId = useAppStore((state) => state.selectedPatientId);
  const setSelectedTriageCaseId = useAppStore(
    (state) => state.setSelectedTriageCaseId,
  );

  const {
    handleSubmit,
    register,
    setValue,
    control,
    formState: { errors },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: intakeDraft,
  });

  const symptomDuration = useWatch({ control, name: "symptomDuration" });
  const urgencyLevel = useWatch({ control, name: "urgencyLevel" });

  const createTriageMutation = useMutation({
    mutationFn: createTriageCase,
    onSuccess: async (triageCase) => {
      setSelectedTriageCaseId(triageCase.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triageQueue });
      await queryClient.invalidateQueries({ queryKey: queryKeys.triageCases });
      navigate("/patient/next-steps");
    },
  });

  function onSubmit(values: IntakeFormValues) {
    updateIntakeDraft(values);
    const symptoms = values.symptomsText
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const recommendedQueue =
      values.urgencyLevel === "routine" ? "general-physician" : "physician-now";

    createTriageMutation.mutate({
      patientId: selectedPatientId,
      presentingComplaint: values.presentingComplaint.trim(),
      symptoms,
      urgencyLevel: values.urgencyLevel,
      recommendedQueue,
      recommendedAction: `Symptoms present for ${values.symptomDuration.toLowerCase()}.`,
      reviewStatus: "pending",
    });
  }

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={1} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Symptom intake
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                Tell the clinic what is bothering you today.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/patient/onboarding">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {createTriageMutation.isError ? (
              <InfoBanner title="Unable to create triage case" tone="review">
                {getApiErrorMessage(
                  createTriageMutation.error,
                  "Check the intake details and try again.",
                )}
              </InfoBanner>
            ) : null}

            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-brand-soft/70 px-4 py-4">
                <div className="flex items-center gap-2">
                  <StatusPill tone="info">Patient prompt</StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink">
                  Hello {patientDraft.firstName}. Please describe what is
                  bothering you in your own words.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white px-4 py-4">
                <div className="flex items-center gap-2">
                  <StatusPill tone="neutral">Your response</StatusPill>
                </div>
                <div className="mt-3 space-y-3">
                  <Textarea {...register("presentingComplaint")} />
                  {errors.presentingComplaint ? (
                    <p className="text-sm text-warning">
                      {errors.presentingComplaint.message}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-field border border-line bg-white px-4 py-2.5 text-sm font-medium text-muted sm:w-auto"
                  >
                    <MicOff className="h-4 w-4" />
                    Voice capture unavailable
                  </button>
                  <p className="text-xs text-muted">
                    Typed intake is the supported MVP path. Voice input stays
                    disabled so the workflow does not imply missing backend
                    functionality.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">
                How long have you felt this way?
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {symptomDurations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setValue("symptomDuration", duration)}
                    className={
                      symptomDuration === duration
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="symptoms-text"
              >
                Symptom keywords for the queue
              </label>
              <Textarea id="symptoms-text" {...register("symptomsText")} />
              {errors.symptomsText ? (
                <p className="text-sm text-warning">
                  {errors.symptomsText.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Urgency</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue("urgencyLevel", option.value)}
                    className={
                      urgencyLevel === option.value
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full sm:w-auto"
              disabled={createTriageMutation.isPending}
              type="submit"
            >
              Review next steps
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="Patient safety stays visible"
            tone="review"
            icon={<ShieldAlert className="h-4 w-4 text-warning" />}
          >
            Intake does not diagnose. It creates a triage case, preserves the
            patient's words, and lets staff see when a clinician should
            intervene quickly.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-soft text-info">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">
                  Conversational, not overwhelming
                </h3>
                <p className="text-sm text-muted">
                  Patients should never face a long medical questionnaire before
                  they can explain what hurts.
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted">
              The triage case created here drives the live queue and becomes the
              handoff context for the physician workflow.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
