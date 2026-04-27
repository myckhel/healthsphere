import {
  ArrowRight,
  ClipboardList,
  FileScan,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { homeWorkflowCards, homeHighlights } from "@/app/app-content";
import {
  listConsultations,
  listRecords,
  listTriageQueue,
  queryKeys,
} from "@/shared/api/healthsphere";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

export function HomePage() {
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

  const queueCount = queueQuery.data?.length ?? 0;
  const inProgressCount =
    consultationsQuery.data?.filter(
      (consultation) => consultation.status === "in_progress",
    ).length ?? 0;
  const reviewCount =
    recordsQuery.data?.filter((record) => record.reviewStatus !== "approved")
      .length ?? 0;
  const screenIcons = [
    FileScan,
    ClipboardList,
    Stethoscope,
    UsersRound,
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="surface-grid overflow-hidden">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info">Clinic workflow</StatusPill>
              <StatusPill tone="success">Live clinic data</StatusPill>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-xl text-4xl leading-tight text-ink sm:text-[3.2rem]">
                A calm clinic workspace for intake, queue management, records,
                and clinician review.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
                HealthSphere turns the existing backend contract into a real
                front-desk and physician workflow. The app keeps the next safe
                action clear and leaves unsupported automation out of the
                critical path.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/reception/dashboard">
                  Open reception dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="secondary" asChild>
                <Link to="/physician/dashboard">
                  Open physician dashboard
                  <Stethoscope className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              Operational snapshot
            </p>
            <h3 className="text-2xl text-ink">
              The home screen gives staff a quick read on live workload before
              they jump into a queue.
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Waiting now
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {queueCount}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                In consultation
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {inProgressCount}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Records to review
              </p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {reviewCount}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {homeWorkflowCards.map((screen, index) => {
          const Icon = screenIcons[index];

          return (
            <Card key={screen.title} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      {screen.badge}
                    </p>
                    <h3 className="mt-1 text-xl text-ink">{screen.title}</h3>
                  </div>
                </div>
                <StatusPill tone={screen.tone}>Ready</StatusPill>
              </div>

              <p className="text-sm leading-6 text-muted">{screen.body}</p>

              <Button variant="secondary" asChild>
                <Link to={screen.route}>
                  Open page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Why this app stays narrow
            </p>
            <h3 className="text-2xl text-ink">
              This app focuses on real clinic work.
            </h3>
          </div>

          <div className="space-y-3">
            {homeHighlights.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-[1.5rem] bg-white/70 px-4 py-4"
              >
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Immediate next steps
            </p>
            <h3 className="text-2xl text-ink">
              Use these routes to validate the full patient-to-clinician flow.
            </h3>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-white/70 px-4 py-4 text-sm leading-6 text-muted">
              Start at patient onboarding to create a real patient record, then
              complete intake to place that patient into the backend queue.
            </div>
            <div className="rounded-[1.5rem] bg-white/70 px-4 py-4 text-sm leading-6 text-muted">
              Open the physician queue to create or resume a consultation from
              the live triage queue.
            </div>
            <div className="rounded-[1.5rem] bg-white/70 px-4 py-4 text-sm leading-6 text-muted">
              Use the reception dashboard to create and review manual records
              while upload and OCR remain deliberately out of scope.
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3">
          <UsersRound className="h-8 w-8 text-brand" />
          <h3 className="text-xl text-ink">Patient-friendly intake</h3>
          <p className="text-sm leading-6 text-muted">
            Patients can move from identity capture to symptom intake without
            losing their place or re-entering the same details.
          </p>
        </Card>

        <Card className="space-y-3">
          <ShieldCheck className="h-8 w-8 text-info" />
          <h3 className="text-xl text-ink">Visible review gates</h3>
          <p className="text-sm leading-6 text-muted">
            Records and consultation notes are always presented as material for
            staff review, not hidden automation.
          </p>
        </Card>

        <Card className="space-y-3">
          <Stethoscope className="h-8 w-8 text-success" />
          <h3 className="text-xl text-ink">Clinician-ready queue</h3>
          <p className="text-sm leading-6 text-muted">
            Opening the next patient now creates or resumes a persisted
            consultation instead of jumping into a placeholder screen.
          </p>
        </Card>
      </section>
    </div>
  );
}
