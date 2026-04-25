import {
  Activity,
  ClipboardPenLine,
  Clock3,
  FileText,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { physicianChecklist } from "@/app/app-content";
import {
  listConsultations,
  listRecords,
  listTriageQueue,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StatusPill } from "@/shared/ui/status-pill";

export function PhysicianDashboardPage() {
  const queueQuery = useQuery({
    queryKey: queryKeys.triageQueue,
    queryFn: listTriageQueue,
  });
  const consultationsQuery = useQuery({
    queryKey: queryKeys.consultations(),
    queryFn: () => listConsultations(),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.records(),
    queryFn: () => listRecords(),
  });

  const inProgress =
    consultationsQuery.data?.filter(
      (consultation) => consultation.status === "in_progress",
    ).length ?? 0;
  const pendingRecords =
    recordsQuery.data?.filter((record) => record.reviewStatus !== "approved")
      .length ?? 0;

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
              Visit guidance
            </p>
            <h3 className="mt-2 text-2xl text-ink">
              What should remain visible before sign-off
            </h3>
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
