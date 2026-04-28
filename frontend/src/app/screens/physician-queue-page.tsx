import { ArrowRight, Clock3, Stethoscope, UsersRound } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { physicianChecklist } from "@/app/app-content";
import {
  createConsultation,
  listConsultations,
  listTriageQueue,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { LoadingPanel } from "@/shared/ui/loading-panel";
import { useAppStore } from "@/shared/state/app-store";
import { StatusPill } from "@/shared/ui/status-pill";

const consultationOpenSteps = [
  "Checking existing consultation",
  "Creating or resuming visit",
  "Opening clinician workspace",
] as const;

export function PhysicianQueuePage() {
  const navigate = useNavigate();
  const clinicianName = useAppStore((state) => state.clinicianName);
  const setSelectedPatientId = useAppStore(
    (state) => state.setSelectedPatientId,
  );
  const setSelectedTriageCaseId = useAppStore(
    (state) => state.setSelectedTriageCaseId,
  );
  const setActiveConsultationId = useAppStore(
    (state) => state.setActiveConsultationId,
  );
  const [openingTriageCaseId, setOpeningTriageCaseId] = useState<string | null>(
    null,
  );

  const queueQuery = useQuery({
    queryKey: queryKeys.triageQueue,
    queryFn: listTriageQueue,
  });
  const consultationsQuery = useQuery({
    queryKey: queryKeys.consultations(),
    queryFn: () => listConsultations(),
  });

  const createConsultationMutation = useMutation({
    mutationFn: createConsultation,
  });

  async function openQueueItem(patientId: string, triageCaseId: string) {
    setOpeningTriageCaseId(triageCaseId);

    const existing = (consultationsQuery.data ?? []).find(
      (consultation) =>
        consultation.triageCaseId === triageCaseId &&
        consultation.status !== "completed",
    );

    setSelectedPatientId(patientId);
    setSelectedTriageCaseId(triageCaseId);

    if (existing) {
      setActiveConsultationId(existing.id);
      navigate(
        existing.status === "in_progress"
          ? `/physician/consultation/${existing.id}/active`
          : `/physician/consultation/${existing.id}`,
      );
      return;
    }

    try {
      const consultation = await createConsultationMutation.mutateAsync({
        patientId,
        triageCaseId,
        clinicianName,
        status: "ready",
      });

      setActiveConsultationId(consultation.id);
      navigate(`/physician/consultation/${consultation.id}`);
    } finally {
      setOpeningTriageCaseId(null);
    }
  }

  if (
    (queueQuery.isPending && !queueQuery.data) ||
    (consultationsQuery.isPending && !consultationsQuery.data)
  ) {
    return (
      <LoadingPanel
        title="Loading the physician queue"
        description="The clinic queue and consultation state are syncing so the next patient opens into the correct workspace."
        label="Syncing"
        steps={consultationOpenSteps}
        currentStep={0}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Physician queue
            </p>
            <h2 className="text-3xl text-ink">
              See the next patient and begin with context already visible.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Waiting now
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {queueQuery.data?.length ?? 0}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Ready to open
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {
                  (queueQuery.data ?? []).filter((item) =>
                    Boolean(item.patientId),
                  ).length
                }
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                In progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {
                  (consultationsQuery.data ?? []).filter(
                    (item) => item.status === "in_progress",
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(queueQuery.data ?? []).map((patient) => {
              const matchingConsultation = (consultationsQuery.data ?? []).find(
                (consultation) =>
                  consultation.triageCaseId === patient.triageCaseId,
              );
              const isOpening = openingTriageCaseId === patient.triageCaseId;
              const tone = !patient.patientId
                ? ("review" as const)
                : matchingConsultation?.status === "in_progress"
                  ? ("info" as const)
                  : ("success" as const);
              const label = !patient.patientId
                ? "Needs patient record"
                : matchingConsultation?.status === "in_progress"
                  ? "Resume"
                  : matchingConsultation?.status === "completed"
                    ? "Completed"
                    : "Ready";

              return (
                <div
                  key={patient.triageCaseId}
                  className="rounded-[1.75rem] border border-line bg-white px-5 py-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl text-ink">
                          {patient.patientName}
                        </h3>
                        <StatusPill tone={tone}>{label}</StatusPill>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {patient.recommendedQueue ??
                          "General consultation queue"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Clock3 className="h-4 w-4" />
                      {patient.waitMinutes} min
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted">
                    {patient.visitReason}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      disabled={
                        !patient.patientId || Boolean(openingTriageCaseId)
                      }
                      onClick={() =>
                        patient.patientId
                          ? openQueueItem(
                              patient.patientId,
                              patient.triageCaseId,
                            )
                          : undefined
                      }
                    >
                      {isOpening
                        ? "Opening consultation..."
                        : matchingConsultation?.status === "in_progress"
                          ? "Resume consultation"
                          : "Open consultation"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {isOpening ? (
                    <div className="mt-4">
                      <LoadingPanel
                        title="Preparing the clinician workspace"
                        description="The visit is being created or resumed now so the physician opens the right patient context."
                        label="Opening"
                        steps={consultationOpenSteps}
                        currentStep={1}
                        className="border-brand/15 bg-brand-soft/20 p-4 sm:p-5"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <InfoBanner
            title="AI should reduce scanning time, not replace clinical judgment"
            tone="review"
            icon={<Stethoscope className="h-4 w-4 text-warning" />}
          >
            This queue surface keeps only the next patient, visit reason, and
            short summary visible. The physician remains responsible for final
            assessment and documentation.
          </InfoBanner>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl text-ink">
                  Before opening the consultation
                </h3>
                <p className="text-sm text-muted">
                  Keep the physician workflow short and safe.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {physicianChecklist.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-[1.5rem] bg-white/75 px-4 py-4"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  <p className="text-sm leading-6 text-muted">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
