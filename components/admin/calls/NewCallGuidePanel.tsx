import { CalendarClock, CheckCircle2, ListChecks } from "lucide-react";

export function NewCallGuidePanel() {
  return (
    <aside
      aria-label="What happens next"
      className="space-y-4 xl:sticky xl:top-22"
    >
      <section className="rounded-2xl border border-ceda-line bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-ceda-ink">
          What gets created automatically
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-ceda-muted">
          Saving this call sets up the standard 8-step review process right away
          so your team can start configuring questions and scoring.
        </p>

        <ul className="mt-4 space-y-3 text-xs leading-5 text-ceda-body">
          <li className="flex items-start gap-2.5">
            <ListChecks
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-ceda-burgundy"
            />
            <span>
              <strong className="font-semibold text-ceda-ink">
                Review stages:
              </strong>{" "}
              Submitted, Screening, Level 1, Level 2, Adjudication, Feedback,
              Decision, and Award.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-ceda-burgundy"
            />
            <span>
              <strong className="font-semibold text-ceda-ink">
                Start as Draft:
              </strong>{" "}
              Keep the call hidden until you add custom application fields and
              scoring rules.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CalendarClock
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-ceda-burgundy"
            />
            <span>
              <strong className="font-semibold text-ceda-ink">
                Time:
              </strong>{" "}
              Opening and closing dates are saved in Botswana time (UTC+2).
            </span>
          </li>
        </ul>
      </section>
    </aside>
  );
}
