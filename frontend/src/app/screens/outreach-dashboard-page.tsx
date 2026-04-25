import {
  CalendarPlus2,
  MessageCircleMore,
  Phone,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/shared/ui/card";
import { InfoBanner } from "@/shared/ui/info-banner";
import { StatusPill } from "@/shared/ui/status-pill";

const actionIcons = [Phone, CalendarPlus2, MessageCircleMore] as const;
const outreachActions = [
  "Initiate phone outreach",
  "Book follow-up",
  "Send patient message",
] as const;

export function OutreachDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Outreach and intervention
          </p>
          <h2 className="mt-2 text-3xl text-ink">
            Keep follow-up work clearly out of scope until the backend exists.
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="review">No live backend route</StatusPill>
          <StatusPill tone="info">Informational only</StatusPill>
        </div>
      </div>

      <InfoBanner
        title="Outreach automation is not part of the current functional MVP"
        tone="review"
        icon={<TriangleAlert className="h-4 w-4 text-warning" />}
      >
        This page remains explicit about what is missing. There is no backend
        follow-up queue or messaging route wired yet, so staff should not treat
        these controls as active automation.
      </InfoBanner>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Why this stays informational
            </p>
            <h3 className="mt-2 text-2xl text-ink">No implied automation</h3>
          </div>

          <div className="space-y-4 text-sm leading-6 text-muted">
            <div className="rounded-[1.5rem] bg-brand-soft/70 px-4 py-4">
              Follow-up routing should only become actionable after there is a
              real backend queue, persistence model, and human review path for
              message drafts.
            </div>
            <div className="rounded-[1.5rem] bg-white px-4 py-4">
              Until then, keeping this page informational is safer than
              rendering realistic-looking message logs or intervention buttons
              that do not actually work.
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Future capabilities
              </p>
              <h3 className="mt-2 text-2xl text-ink">
                Planned follow-up actions
              </h3>
            </div>
            <StatusPill tone="review">Not active</StatusPill>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-warning/20 bg-warning-soft/80 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-warning">
                Current status
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                Outreach actions are intentionally disabled until backend
                support is implemented.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Safe expectation
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                Use manual clinic processes for follow-up today.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {outreachActions.map((action, index) => {
              const Icon = actionIcons[index];

              return (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[1.25rem] border border-line bg-white px-4 py-4 text-left text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  {action}
                </button>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
