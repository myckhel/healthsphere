import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Languages, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  patientFlowSteps,
  patientLanguages,
  visitTypes,
} from "@/app/app-content";
import {
  createPatient,
  getApiErrorMessage,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { Input } from "@/shared/ui/input";
import { StepProgress } from "@/shared/ui/step-progress";
import { useAppStore } from "@/shared/state/app-store";
import { Textarea } from "@/shared/ui/textarea";

const onboardingSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phoneNumber: z
    .string()
    .trim()
    .min(7, "Enter a phone number the clinic can reach."),
  externalId: z.string().trim().max(64).optional(),
  dateOfBirth: z.string().optional(),
  sexAtBirth: z.string().trim().max(32).optional(),
  preferredLanguage: z.string().trim().min(1),
  visitType: z.string().trim().min(1),
  consentGranted: z.boolean().refine((value) => value, {
    message: "Consent is required before the visit can continue.",
  }),
  notes: z.string().max(2000).optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function PatientOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientDraft = useAppStore((state) => state.patientDraft);
  const updatePatientDraft = useAppStore((state) => state.updatePatientDraft);
  const setSelectedPatientId = useAppStore(
    (state) => state.setSelectedPatientId,
  );
  const setSelectedTriageCaseId = useAppStore(
    (state) => state.setSelectedTriageCaseId,
  );

  const {
    handleSubmit,
    register,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: patientDraft.firstName,
      lastName: patientDraft.lastName,
      phoneNumber: patientDraft.phoneNumber,
      externalId: patientDraft.externalId,
      dateOfBirth: patientDraft.dateOfBirth,
      sexAtBirth: patientDraft.sexAtBirth,
      preferredLanguage: patientDraft.preferredLanguage,
      visitType: patientDraft.visitType,
      consentGranted: patientDraft.consentGranted,
      notes: patientDraft.notes,
    },
  });

  const preferredLanguage = useWatch({ control, name: "preferredLanguage" });
  const visitType = useWatch({ control, name: "visitType" });
  const consentGranted = useWatch({ control, name: "consentGranted" });

  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async (patient) => {
      setSelectedPatientId(patient.id);
      setSelectedTriageCaseId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients() });
      navigate("/patient/intake");
    },
  });

  function onSubmit(values: OnboardingFormValues) {
    updatePatientDraft(values);
    createPatientMutation.mutate({
      externalId: values.externalId?.trim() || null,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dateOfBirth: values.dateOfBirth?.trim() || null,
      sexAtBirth: values.sexAtBirth?.trim() || null,
      phoneNumber: values.phoneNumber.trim(),
      consentStatus: values.consentGranted ? "granted" : "pending",
      notes: values.notes?.trim() || null,
    });
  }

  return (
    <div className="space-y-6">
      <StepProgress steps={patientFlowSteps} currentStep={0} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Patient onboarding
              </p>
              <h2 className="mt-2 text-3xl text-ink">
                Start the visit with only the essentials.
              </h2>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/">
                <ChevronLeft className="h-4 w-4" />
                Back home
              </Link>
            </Button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {createPatientMutation.isError ? (
              <InfoBanner title="Unable to create patient" tone="review">
                {getApiErrorMessage(
                  createPatientMutation.error,
                  "Check the patient details and try again.",
                )}
              </InfoBanner>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="first-name"
                >
                  First name
                </label>
                <Input id="first-name" {...register("firstName")} />
                {errors.firstName ? (
                  <p className="text-sm text-warning">
                    {errors.firstName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="last-name"
                >
                  Last name
                </label>
                <Input id="last-name" {...register("lastName")} />
                {errors.lastName ? (
                  <p className="text-sm text-warning">
                    {errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="phone-number"
              >
                Phone number
              </label>
              <Input id="phone-number" {...register("phoneNumber")} />
              {errors.phoneNumber ? (
                <p className="text-sm text-warning">
                  {errors.phoneNumber.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="date-of-birth"
                >
                  Date of birth
                </label>
                <Input
                  id="date-of-birth"
                  type="date"
                  {...register("dateOfBirth")}
                />
              </div>

              <div className="space-y-3">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="sex-at-birth"
                >
                  Sex at birth
                </label>
                <Input id="sex-at-birth" {...register("sexAtBirth")} />
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="external-id"
              >
                Existing patient ID if available
              </label>
              <Input id="external-id" {...register("externalId")} />
              <p className="text-sm leading-6 text-muted">
                If the patient already has a clinic record, enter the existing
                ID so staff can catch duplicates before the consultation begins.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Preferred language</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {patientLanguages.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setValue("preferredLanguage", language)}
                    className={
                      preferredLanguage === language
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Visit type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {visitTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("visitType", type)}
                    className={
                      visitType === type
                        ? "rounded-[1.5rem] border border-brand bg-brand-soft px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                        : "rounded-[1.5rem] border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-ink"
                htmlFor="notes"
              >
                Intake notes for staff
              </label>
              <Textarea id="notes" {...register("notes")} />
            </div>

            <label className="flex items-start gap-3 rounded-[1.5rem] border border-line bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line text-brand"
                {...register("consentGranted")}
              />
              <span>
                I understand this information will be used only to support my
                clinic visit and handoff to the physician.
              </span>
            </label>
            {errors.consentGranted ? (
              <p className="text-sm text-warning">
                {errors.consentGranted.message}
              </p>
            ) : null}

            <Button
              className="w-full sm:w-auto"
              disabled={!consentGranted || createPatientMutation.isPending}
              type="submit"
            >
              Continue to symptoms
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="Why this screen is short"
            icon={<ShieldCheck className="h-4 w-4 text-brand" />}
          >
            HealthSphere asks only for the information needed to create a
            patient record and move that patient safely into intake.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">Language-first access</h3>
                <p className="text-sm text-muted">
                  Patients should be able to begin care in the language they
                  understand best.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted">
              <p>
                Use large tap targets, one-column layout, and direct labels.
              </p>
              <p>
                Avoid long instructions, hidden menus, or unfamiliar healthcare
                terms during intake.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
