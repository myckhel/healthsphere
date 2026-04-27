import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Languages, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
  describeApiError,
  formatPatientName,
  lookupPatientByExternalId,
  type PatientListItem,
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

type IntakeMode = "self-service" | "staff-assisted";

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
    getValues,
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
  const externalId = useWatch({ control, name: "externalId" }) ?? "";
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("self-service");
  const [showNewPatientFlow, setShowNewPatientFlow] = useState(false);
  const [matchedPatient, setMatchedPatient] = useState<PatientListItem | null>(
    null,
  );
  const [resolvedExternalId, setResolvedExternalId] = useState(
    patientDraft.externalId.trim(),
  );

  const lookupPatientMutation = useMutation({
    mutationFn: (requestedExternalId: string) =>
      lookupPatientByExternalId(
        requestedExternalId,
        intakeMode === "self-service"
          ? {
              actor: {
                actorId: requestedExternalId.trim(),
                actorRole: "patient",
                clinicId: null,
              },
            }
          : undefined,
      ),
    onSuccess: (patient, requestedExternalId) => {
      const normalizedExternalId = requestedExternalId.trim();
      setResolvedExternalId(normalizedExternalId);
      setMatchedPatient(patient);
      setShowNewPatientFlow(patient === null);
      if (patient === null) {
        setSelectedPatientId(null);
      }
    },
  });

  function handleIntakeModeChange(mode: IntakeMode) {
    setIntakeMode(mode);
    setMatchedPatient(null);
    setResolvedExternalId("");
    setShowNewPatientFlow(false);
    setSelectedPatientId(null);
    lookupPatientMutation.reset();
  }

  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: async (patient) => {
      setSelectedPatientId(patient.id);
      setSelectedTriageCaseId(null);
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      navigate("/patient/intake");
    },
  });

  function handleExistingPatientLookup() {
    const normalizedExternalId = externalId.trim();
    if (!normalizedExternalId) {
      setMatchedPatient(null);
      setResolvedExternalId("");
      setShowNewPatientFlow(true);
      return;
    }

    lookupPatientMutation.mutate(normalizedExternalId);
  }

  function handleContinueWithExistingPatient() {
    if (!matchedPatient) {
      return;
    }

    const values = getValues();
    updatePatientDraft({
      firstName: matchedPatient.firstName,
      lastName: matchedPatient.lastName,
      externalId: matchedPatient.externalId ?? values.externalId?.trim() ?? "",
      phoneNumber: matchedPatient.phoneNumber ?? "",
      preferredLanguage: values.preferredLanguage,
      visitType: values.visitType,
      dateOfBirth: matchedPatient.dateOfBirth ?? "",
      sexAtBirth: matchedPatient.sexAtBirth ?? "",
      consentGranted: values.consentGranted,
      notes: values.notes ?? "",
    });
    setSelectedPatientId(matchedPatient.id);
    setSelectedTriageCaseId(null);
    navigate("/patient/intake");
  }

  function handleContinueAsNewPatient() {
    setMatchedPatient(null);
    setResolvedExternalId("");
    setShowNewPatientFlow(true);
    setSelectedPatientId(null);
  }

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

  const patientCreateError = createPatientMutation.isError
    ? describeApiError(
        createPatientMutation.error,
        "Check the patient details and try again.",
      )
    : null;
  const patientLookupError = lookupPatientMutation.isError
    ? describeApiError(
        lookupPatientMutation.error,
        "Unable to verify that patient ID right now.",
      )
    : null;
  const normalizedExternalId = externalId.trim();
  const showingResolvedLookup = normalizedExternalId === resolvedExternalId;
  const activeMatchedPatient = showingResolvedLookup ? matchedPatient : null;
  const showMatchedPatientCard = Boolean(
    activeMatchedPatient && !showNewPatientFlow,
  );
  const showMissingPatientNotice = Boolean(
    lookupPatientMutation.isSuccess &&
    !activeMatchedPatient &&
    Boolean(resolvedExternalId) &&
    showingResolvedLookup,
  );

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
            <div className="space-y-3 rounded-[1.5rem] border border-line bg-brand-soft/35 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Check for an existing patient record first
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Enter the clinic patient ID before creating a new chart. Pick
                  self-service when the patient is identifying their own record,
                  or staff-assisted when front desk staff are looking up the
                  chart inside clinic scope.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleIntakeModeChange("self-service")}
                  className={
                    intakeMode === "self-service"
                      ? "rounded-[1.25rem] border border-brand bg-white px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                      : "rounded-[1.25rem] border border-line bg-white/80 px-4 py-3 text-left text-sm font-medium text-ink"
                  }
                >
                  Patient self-service
                </button>
                <button
                  type="button"
                  onClick={() => handleIntakeModeChange("staff-assisted")}
                  className={
                    intakeMode === "staff-assisted"
                      ? "rounded-[1.25rem] border border-brand bg-white px-4 py-3 text-left text-sm font-semibold text-brand-strong"
                      : "rounded-[1.25rem] border border-line bg-white/80 px-4 py-3 text-left text-sm font-medium text-ink"
                  }
                >
                  Staff-assisted lookup
                </button>
              </div>

              <div className="space-y-3">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="external-id"
                >
                  Existing patient ID
                </label>
                <Input id="external-id" {...register("externalId")} />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={lookupPatientMutation.isPending}
                    onClick={handleExistingPatientLookup}
                  >
                    {intakeMode === "self-service"
                      ? "Find my record"
                      : "Confirm patient ID"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleContinueAsNewPatient}
                  >
                    Register new patient instead
                  </Button>
                </div>
              </div>
            </div>

            {patientLookupError ? (
              <InfoBanner title="Unable to verify patient ID" tone="review">
                <div className="space-y-2">
                  <p>{patientLookupError.message}</p>
                  {patientLookupError.details.map((detail) => (
                    <p key={detail} className="text-sm leading-6 text-muted">
                      {detail}
                    </p>
                  ))}
                </div>
              </InfoBanner>
            ) : null}

            {showMatchedPatientCard && activeMatchedPatient ? (
              <Card className="space-y-4 border border-success/25 bg-success-soft/35 p-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
                    Existing record found
                  </p>
                  <h3 className="text-2xl text-ink">
                    Confirm this is the patient before intake.
                  </h3>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                      Name
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {formatPatientName(activeMatchedPatient)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                      Existing patient ID
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {activeMatchedPatient.externalId ?? "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                      Date of birth
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {activeMatchedPatient.dateOfBirth ?? "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted">
                      Phone number
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {activeMatchedPatient.phoneNumber ?? "Not recorded"}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={!consentGranted}
                    onClick={handleContinueWithExistingPatient}
                  >
                    This matches, continue to symptoms
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleContinueAsNewPatient}
                  >
                    This is not the patient
                  </Button>
                </div>
              </Card>
            ) : null}

            {showMissingPatientNotice ? (
              <InfoBanner title="No existing record matched that ID">
                {intakeMode === "self-service"
                  ? "No record was found for that patient ID. Continue below if you need to register as a new patient."
                  : "Use the new-patient section below if this person needs a fresh chart in the current clinic scope."}
              </InfoBanner>
            ) : null}

            {patientCreateError ? (
              <InfoBanner title="Unable to create patient" tone="review">
                <div className="space-y-2">
                  <p>{patientCreateError.message}</p>
                  {patientCreateError.details.map((detail) => (
                    <p key={detail} className="text-sm leading-6 text-muted">
                      {detail}
                    </p>
                  ))}
                </div>
              </InfoBanner>
            ) : null}

            {showNewPatientFlow ? (
              <div className="space-y-6 rounded-[1.5rem] border border-line bg-white/75 px-4 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    New patient details
                  </p>
                  <h3 className="mt-2 text-2xl text-ink">
                    No chart matched. Capture the essentials for a new record.
                  </h3>
                </div>

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

                {patientCreateError?.kind ===
                "duplicate_patient_external_id" ? (
                  <p className="text-sm text-warning">
                    That patient ID already belongs to someone in this clinic.
                    Confirm the existing chart above or enter a different ID.
                  </p>
                ) : null}
              </div>
            ) : null}

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

            {showNewPatientFlow ? (
              <Button
                className="w-full sm:w-auto"
                disabled={!consentGranted || createPatientMutation.isPending}
                type="submit"
              >
                Create patient and continue to symptoms
              </Button>
            ) : null}
          </form>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="Why this screen is short"
            icon={<ShieldCheck className="h-4 w-4 text-brand" />}
          >
            HealthSphere checks for an existing chart before creating a new
            patient record, then moves the confirmed visit safely into intake.
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
