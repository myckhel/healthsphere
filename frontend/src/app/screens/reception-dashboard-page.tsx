import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardPlus, FileScan, UserPlus, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { recordReviewOptions, recordTypeOptions } from "@/app/app-content";
import {
  createRecord,
  formatPatientName,
  getApiErrorMessage,
  getRecord,
  listPatients,
  listRecords,
  queryKeys,
  reviewRecord,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StatusPill } from "@/shared/ui/status-pill";
import { Textarea } from "@/shared/ui/textarea";
import { useAppStore } from "@/shared/state/app-store";

const recordSchema = z.object({
  patientId: z
    .string()
    .trim()
    .min(1, "Select a patient before creating a record."),
  title: z.string().trim().min(1, "Record title is required."),
  recordType: z.string().trim().min(1),
  rawText: z.string().trim().min(10, "Enter enough detail for review."),
  structuredSummary: z.string().trim().optional(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

export function ReceptionDashboardPage() {
  const queryClient = useQueryClient();
  const selectedPatientId = useAppStore((state) => state.selectedPatientId);
  const setSelectedPatientId = useAppStore(
    (state) => state.setSelectedPatientId,
  );
  const selectedRecordId = useAppStore((state) => state.selectedRecordId);
  const setSelectedRecordId = useAppStore((state) => state.setSelectedRecordId);

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(),
    queryFn: () => listPatients(),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(selectedPatientId ?? undefined),
    queryFn: () => listRecords(selectedPatientId ?? undefined),
  });
  const recordDetailQuery = useQuery({
    queryKey: selectedRecordId
      ? queryKeys.record(selectedRecordId)
      : ["record", "none"],
    queryFn: () => getRecord(selectedRecordId as string),
    enabled: Boolean(selectedRecordId),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      patientId: selectedPatientId ?? "",
      title: "Front-desk record capture",
      recordType: "medical_card",
      rawText: "",
      structuredSummary: "",
    },
  });

  useEffect(() => {
    if (selectedPatientId) {
      setValue("patientId", selectedPatientId);
    }
  }, [selectedPatientId, setValue]);

  useEffect(() => {
    if (!selectedRecordId && recordsQuery.data?.[0]) {
      setSelectedRecordId(recordsQuery.data[0].id);
    }
  }, [recordsQuery.data, selectedRecordId, setSelectedRecordId]);

  const createRecordMutation = useMutation({
    mutationFn: createRecord,
    onSuccess: async (record) => {
      setSelectedRecordId(record.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.records(selectedPatientId ?? undefined),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.records() });
    },
  });

  const reviewRecordMutation = useMutation({
    mutationFn: ({
      recordId,
      reviewStatus,
    }: {
      recordId: string;
      reviewStatus: string;
    }) => reviewRecord(recordId, reviewStatus),
    onSuccess: async (record) => {
      setSelectedRecordId(record.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.records(selectedPatientId ?? undefined),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.record(record.id),
      });
    },
  });

  function onSubmit(values: RecordFormValues) {
    setSelectedPatientId(values.patientId);
    createRecordMutation.mutate({
      patientId: values.patientId,
      title: values.title.trim(),
      recordType: values.recordType,
      rawText: values.rawText.trim(),
      structuredData: values.structuredSummary?.trim()
        ? { summary: values.structuredSummary.trim() }
        : null,
      provenance: {
        captured_by: "reception-dashboard",
        method: "manual-entry",
      },
      reviewStatus: "pending",
    });
  }

  const selectedRecord = recordDetailQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Reception dashboard
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Register patients and capture records with explicit review states.
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="review">Manual review required</StatusPill>
          <StatusPill tone="neutral">Staff workspace</StatusPill>
        </div>
      </div>

      <InfoBanner
        title="Manual record capture is the supported MVP path"
        tone="review"
        icon={<WifiOff className="h-4 w-4 text-warning" />}
      >
        Binary upload and OCR are still out of scope here. Front-desk staff
        should enter the record text manually, review it, and only then approve
        the record.
      </InfoBanner>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1fr_1fr]">
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Action panel
            </p>
            <h3 className="text-2xl text-ink">
              Choose the next front-desk action
            </h3>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/patient/onboarding">
                <UserPlus className="h-4 w-4" />
                New patient registration
              </Link>
            </Button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[1.25rem] border border-line bg-white px-4 py-4 text-left text-sm font-medium text-ink"
            >
              <ClipboardPlus className="h-4 w-4 text-brand" />
              Manual medical card capture
            </button>
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-3 rounded-[1.25rem] border border-line bg-white px-4 py-4 text-left text-sm font-medium text-muted"
            >
              <FileScan className="h-4 w-4" />
              Upload and OCR unavailable
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
            Select a patient first so the record can be attached to the right
            chart. If the patient is not yet registered, use the onboarding flow
            before capturing the record.
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">Patients in scope</p>
            {patientsQuery.data?.length ? (
              patientsQuery.data.slice(0, 5).map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={
                    patient.id === selectedPatientId
                      ? "w-full rounded-[1.25rem] border border-brand bg-brand-soft px-4 py-3 text-left"
                      : "w-full rounded-[1.25rem] border border-line bg-white px-4 py-3 text-left"
                  }
                >
                  <p className="text-sm font-semibold text-ink">
                    {formatPatientName(patient)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    {patient.externalId || "No external ID"}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.25rem] bg-white/75 px-4 py-4 text-sm text-muted">
                No patients found yet. Create one from the onboarding flow.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Manual record form
              </p>
              <h3 className="mt-2 text-2xl text-ink">
                Capture reviewable record text
              </h3>
            </div>
            <StatusPill tone="info">POST /records</StatusPill>
          </div>

          {createRecordMutation.isError ? (
            <InfoBanner title="Unable to save record" tone="review">
              {getApiErrorMessage(createRecordMutation.error)}
            </InfoBanner>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink"
                htmlFor="patientId"
              >
                Patient
              </label>
              <select
                id="patientId"
                {...register("patientId")}
                className="h-12 w-full rounded-field border border-line bg-white px-4 text-ink outline-none"
              >
                <option value="">Select a patient</option>
                {patientsQuery.data?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {formatPatientName(patient)}
                  </option>
                ))}
              </select>
              {errors.patientId ? (
                <p className="text-sm text-warning">
                  {errors.patientId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="title">
                Record title
              </label>
              <input
                id="title"
                {...register("title")}
                className="h-12 w-full rounded-field border border-line bg-white px-4 text-ink outline-none"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink"
                htmlFor="recordType"
              >
                Record type
              </label>
              <select
                id="recordType"
                {...register("recordType")}
                className="h-12 w-full rounded-field border border-line bg-white px-4 text-ink outline-none"
              >
                {recordTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="rawText">
                Source text
              </label>
              <Textarea id="rawText" {...register("rawText")} />
              {errors.rawText ? (
                <p className="text-sm text-warning">{errors.rawText.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink"
                htmlFor="structuredSummary"
              >
                Review summary for staff
              </label>
              <Textarea
                id="structuredSummary"
                {...register("structuredSummary")}
              />
            </div>

            <Button
              type="submit"
              disabled={createRecordMutation.isPending}
              className="w-full sm:w-auto"
            >
              Save record for review
            </Button>
          </form>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Record review
              </p>
              <h3 className="mt-2 text-2xl text-ink">Review saved records</h3>
            </div>
            <StatusPill tone="success">GET /records</StatusPill>
          </div>

          <div className="space-y-3">
            {recordsQuery.data?.length ? (
              recordsQuery.data.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedRecordId(record.id)}
                  className={
                    selectedRecordId === record.id
                      ? "w-full rounded-[1.25rem] border border-brand bg-brand-soft px-4 py-4 text-left"
                      : "w-full rounded-[1.25rem] border border-line bg-white px-4 py-4 text-left"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {record.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {record.recordType}
                      </p>
                    </div>
                    <StatusPill
                      tone={
                        record.reviewStatus === "approved"
                          ? "success"
                          : "review"
                      }
                    >
                      {record.reviewStatus}
                    </StatusPill>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.25rem] bg-white/75 px-4 py-4 text-sm text-muted">
                No records found for the current scope.
              </div>
            )}
          </div>

          {selectedRecord ? (
            <div className="space-y-4 rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {selectedRecord.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    {selectedRecord.recordType}
                  </p>
                </div>
                <StatusPill
                  tone={
                    selectedRecord.reviewStatus === "approved"
                      ? "success"
                      : "review"
                  }
                >
                  {selectedRecord.reviewStatus}
                </StatusPill>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Source text
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {selectedRecord.rawText || "No record text supplied."}
                </p>
              </div>

              {selectedRecord.structuredData ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Structured summary
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-[1rem] bg-panel px-3 py-3 text-xs text-muted">
                    {JSON.stringify(selectedRecord.structuredData, null, 2)}
                  </pre>
                </div>
              ) : null}

              {reviewRecordMutation.isError ? (
                <InfoBanner
                  title="Unable to update review status"
                  tone="review"
                >
                  {getApiErrorMessage(reviewRecordMutation.error)}
                </InfoBanner>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {recordReviewOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      option.value === "approved" ? "default" : "secondary"
                    }
                    onClick={() =>
                      reviewRecordMutation.mutate({
                        recordId: selectedRecord.id,
                        reviewStatus: option.value,
                      })
                    }
                    disabled={reviewRecordMutation.isPending}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
