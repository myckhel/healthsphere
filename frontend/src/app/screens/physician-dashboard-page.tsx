import {
  Activity,
  ClipboardPenLine,
  Clock3,
  FileText,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { physicianChecklist } from "@/app/app-content";
import {
  describeApiError,
  listConsultations,
  listRecords,
  listTriageQueue,
  queryKeys,
  type ConsultationStatus,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StatusPill } from "@/shared/ui/status-pill";

export function PhysicianDashboardPage() {
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<
    "all" | ConsultationStatus
  >("all");
  const queueQuery = useQuery({
    queryKey: queryKeys.triageQueue,
    queryFn: listTriageQueue,
  });
  const allConsultationsQuery = useQuery({
    queryKey: queryKeys.consultations(),
    queryFn: () => listConsultations(),
  });
  const consultationsQuery = useQuery({
    queryKey: queryKeys.consultations(
      undefined,
      consultationStatusFilter === "all" ? undefined : consultationStatusFilter,
    ),
    queryFn: () =>
      listConsultations(
        undefined,
        consultationStatusFilter === "all"
          ? undefined
          : consultationStatusFilter,
      ),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(),
    queryFn: () => listRecords(),
  });

  const inProgress =
    allConsultationsQuery.data?.filter(
      (consultation) => consultation.status === "in_progress",
    ).length ?? 0;
  const pendingRecords =
    recordsQuery.data?.filter((record) => record.reviewStatus !== "approved")
      .length ?? 0;
  const consultationCounts = {
    all: allConsultationsQuery.data?.length ?? 0,
    ready:
      allConsultationsQuery.data?.filter(
        (consultation) => consultation.status === "ready",
      ).length ?? 0,
    in_progress: inProgress,
    completed:
      allConsultationsQuery.data?.filter(
        (consultation) => consultation.status === "completed",
      ).length ?? 0,
  };
  const consultationPanelError = consultationsQuery.isError
    ? describeApiError(
        consultationsQuery.error,
        "Unable to load consultations for this clinic.",
      )
    : null;
  const consultationFilterOptions: Array<{
    value: "all" | ConsultationStatus;
    label: string;
  }> = [
    { value: "all", label: "All sessions" },
    { value: "ready", label: "Ready" },
    { value: "in_progress", label: "In progress" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Physician dashboard
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            See live queue pressure and jump straight into the next
            consultation.
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Queue synced</StatusPill>
          <StatusPill tone="review">Drafts require clinician review</StatusPill>
        </div>
      </div>

      <InfoBanner
        title="The physician queue is now connected to persisted consultation state"
        tone="review"
        icon={<Activity className="h-4 w-4 text-warning" />}
      >
        Opening a patient from the queue creates or resumes a consultation
        against the backend. Notes remain drafts until the clinician finishes
        the visit and chooses the next action.
      </InfoBanner>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
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
                In progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {inProgress}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Records pending
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {pendingRecords}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(queueQuery.data ?? []).slice(0, 3).map((item) => (
              <div
                key={item.triageCaseId}
                className="rounded-[1.25rem] border border-line bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.patientName}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {item.visitReason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Clock3 className="h-4 w-4" />
                    {item.waitMinutes} min
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button asChild className="w-full sm:w-auto">
            <Link to="/physician/queue">Open live queue</Link>
          </Button>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Consultation review list
            </p>
            <h3 className="mt-2 text-2xl text-ink">
              Review consultation state without leaving the dashboard
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {consultationFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setConsultationStatusFilter(option.value)}
                className={
                  consultationStatusFilter === option.value
                    ? "rounded-full border border-brand bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong"
                    : "rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                }
              >
                {option.label} ({consultationCounts[option.value]})
              </button>
            ))}
          </div>

          <div className="rounded-[1.25rem] bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
            The live queue still creates or resumes the active visit. This
            dashboard panel is for review, filtering, and jumping back into the
            right session without changing queue ordering.
          </div>

          <div className="space-y-3">
            {consultationsQuery.isPending ? (
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4 text-sm text-muted">
                Loading consultation sessions for the current clinic scope.
              </div>
            ) : null}

            {consultationPanelError ? (
              <InfoBanner
                title="Unable to load consultation sessions"
                tone="review"
              >
                <div className="space-y-2">
                  <p>{consultationPanelError.message}</p>
                  {consultationPanelError.details.map((detail) => (
                    <p key={detail} className="text-sm leading-6 text-muted">
                      {detail}
                    </p>
                  ))}
                </div>
              </InfoBanner>
            ) : null}

            {!consultationsQuery.isPending && !consultationPanelError
              ? (consultationsQuery.data ?? [])
                  .slice(0, 4)
                  .map((consultation) => {
                    const consultationHref =
                      consultation.status === "in_progress"
                        ? `/physician/consultation/${consultation.id}/active`
                        : consultation.status === "completed"
                          ? `/physician/consultation/${consultation.id}/outcome`
                          : `/physician/consultation/${consultation.id}`;

                    return (
                      <div
                        key={consultation.id}
                        className="rounded-[1.25rem] border border-line bg-white px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {consultation.patientSnapshot?.fullName ||
                                consultation.patientId}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {consultation.clinicianName ||
                                "Clinician not named yet"}
                            </p>
                          </div>
                          <StatusPill
                            tone={
                              consultation.status === "completed"
                                ? "review"
                                : consultation.status === "in_progress"
                                  ? "info"
                                  : "success"
                            }
                          >
                            {consultation.status.replace("_", " ")}
                          </StatusPill>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted">
                          {consultation.draftAssessmentPackage
                            ?.complaintSummary ||
                            consultation.patientSnapshot?.presentingComplaint ||
                            "No complaint summary is attached yet."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-muted">
                          <span>
                            Next action: {consultation.nextAction || "Not set"}
                          </span>
                          <span>
                            Urgency:{" "}
                            {consultation.patientSnapshot?.urgencyLevel ||
                              "Not triaged"}
                          </span>
                          <span>
                            Review:{" "}
                            {consultation.clinicianReview.isFinalized
                              ? "Final reviewed"
                              : "Draft only"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="secondary" asChild>
                            <Link to={consultationHref}>
                              {consultation.status === "in_progress"
                                ? "Resume session"
                                : consultation.status === "completed"
                                  ? "Review outcome"
                                  : "Open session"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })
              : null}

            {!consultationsQuery.isPending &&
            !consultationPanelError &&
            !consultationsQuery.data?.length ? (
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4 text-sm text-muted">
                No consultations match the current filter.
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Visit guidance
            </p>
          </div>

          <div className="space-y-3">
            {physicianChecklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.25rem] bg-white/85 px-4 py-4"
              >
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <ClipboardPenLine className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-muted">{item}</p>
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4">
                <UsersRound className="h-5 w-5 text-brand" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Queue visibility
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  The physician sees the same queue ordering the patient and
                  front desk see.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4">
                <FileText className="h-5 w-5 text-brand" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Persisted notes
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Consultation notes survive navigation and reload because the
                  source of truth is the backend session.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
