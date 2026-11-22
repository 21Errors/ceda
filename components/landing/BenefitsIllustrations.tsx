import { Banknote, Briefcase, Check, FileText, Sprout } from "lucide-react";

const FUNDING_DOORS = [
  {
    label: "CEDA Loans",
    Icon: Banknote,
    iconBg: "bg-[#FFF0E2] text-[#7A1F14]",
    rowClass: "bento-door-1",
    checkClass: "bento-door-check-1",
  },
  {
    label: "Innovation Grants",
    Icon: Sprout,
    iconBg: "bg-[#FFF1E4] text-[#C55D06]",
    rowClass: "bento-door-2",
    checkClass: "bento-door-check-2",
  },
  {
    label: "Business Support",
    Icon: Briefcase,
    iconBg: "bg-[#E8F5ED] text-[#14532D]",
    rowClass: "bento-door-3",
    checkClass: "bento-door-check-3",
  },
] as const;

export function FundingIllustration() {
  return (
    <div
      aria-hidden="true"
      className="bento-stage relative flex min-h-52 items-center overflow-clip rounded-xl border border-[#7A1F14]/10 bg-[#FFF9F4] p-4 sm:p-5"
    >
      <div className="bento-funding-flow w-full">
        {/* Left: Approved Business Idea */}
        <div className="bento-funding-idea rounded-xl border border-[#7A1F14]/14 bg-white p-3.5 shadow-[0_4px_14px_rgba(51,31,23,0.04)]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF0E2] text-[#7A1F14]">
              <FileText className="block h-3.5 w-3.5" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5ED] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
              <Check className="block h-2.5 w-2.5 stroke-[2.8]" />
              Approved
            </span>
          </div>

          <p className="mt-3 text-xs font-bold text-[#331F17]">
            Your business idea
          </p>

          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[#331F17]/12" />
            <div className="h-1.5 w-3/4 rounded-full bg-[#331F17]/12" />
          </div>

          <p className="mt-3 text-[10px] font-medium text-[#7F5E4E]">
            Qualifies for funding
          </p>
        </div>

        {/* Center: Clean Branching Connector (horizontal on wide cards, vertical line on narrow) */}
        <div className="bento-funding-connector relative flex items-center justify-center">
          {/* Desktop / wide horizontal branching SVG locked to the 140px door stack */}
          <svg
            viewBox="0 0 92 140"
            fill="none"
            className="bento-funding-branches-wide hidden h-35 w-23 shrink-0"
          >
            {/* Input stem from approved idea to branch junction */}
            <line
              x1="0"
              y1="70"
              x2="42"
              y2="70"
              stroke="#7A1F14"
              strokeOpacity="0.24"
              strokeWidth="1.6"
            />
            {/* Three branches fanning smoothly to exact vertical centers (20, 70, 120) */}
            <path
              d="M42 70 C64 70, 64 20, 90 20"
              stroke="#7A1F14"
              strokeOpacity="0.24"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <line
              x1="42"
              y1="70"
              x2="90"
              y2="70"
              stroke="#E8710A"
              strokeOpacity="0.45"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M42 70 C64 70, 64 120, 90 120"
              stroke="#7A1F14"
              strokeOpacity="0.24"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Clean terminal dots */}
            <circle cx="89" cy="20" r="2.5" fill="#7A1F14" fillOpacity="0.45" />
            <circle cx="89" cy="70" r="2.5" fill="#E8710A" fillOpacity="0.7" />
            <circle cx="89" cy="120" r="2.5" fill="#16803C" fillOpacity="0.55" />
          </svg>

          {/* Traveling pulse dot along the horizontal input stem */}
          <span className="bento-funding-packet pointer-events-none absolute left-0 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-[#E8710A]" />

          {/* Compact vertical connecting line for narrow stacked cards */}
          <div className="bento-funding-line-narrow h-6 w-px bg-[#7A1F14]/24" />
        </div>

        {/* Right: Three Unlocked Funding Doors (exact 140px height: 3 x 40px + 2 x 10px) */}
        <div className="flex flex-col gap-2.5">
          {FUNDING_DOORS.map((door) => {
            const DoorIcon = door.Icon;
            return (
              <div
                key={door.label}
                className={`bento-funding-door ${door.rowClass} flex h-10 items-center justify-between gap-2 rounded-xl border border-[#7A1F14]/12 bg-white px-3 shadow-[0_2px_10px_rgba(51,31,23,0.03)]`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${door.iconBg}`}
                  >
                    <DoorIcon className="block h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-xs font-semibold text-[#331F17]">
                    {door.label}
                  </span>
                </div>

                <span
                  className={`bento-door-check ${door.checkClass} inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E8F5ED] text-[#14532D]`}
                >
                  <Check className="block h-2.5 w-2.5 stroke-[2.8]" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const RUBRIC_CRITERIA = [
  {
    label: "Feasibility",
    score: "92%",
    widthClass: "w-[92%]",
    barClass: "bg-[#7A1F14]",
    animClass: "bento-rubric-1",
  },
  {
    label: "Customer need",
    score: "88%",
    widthClass: "w-[88%]",
    barClass: "bg-[#E8710A]",
    animClass: "bento-rubric-2",
  },
  {
    label: "Botswana impact",
    score: "95%",
    widthClass: "w-[95%]",
    barClass: "bg-[#7A1F14]",
    animClass: "bento-rubric-3",
  },
] as const;

export function FairReviewIllustration() {
  return (
    <div
      aria-hidden="true"
      className="bento-stage relative flex min-h-52 flex-col justify-center overflow-clip rounded-xl border border-[#7A1F14]/10 bg-[#FFF9F4] p-4"
    >
      {/* Top reviewer consensus header */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#FFF9F4] bg-[#7A1F14] text-[9px] font-bold text-white">
              TM
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#FFF9F4] bg-[#B4441A] text-[9px] font-bold text-white">
              KO
            </span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#FFF9F4] bg-[#E8710A] text-[9px] font-bold text-white">
              LP
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#573E32]">
            3 Reviewers
          </span>
        </div>

        <span className="bento-score-badge inline-flex items-center gap-1 rounded-full border border-[#7A1F14]/15 bg-white px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#7A1F14] tabular-nums shadow-[0_2px_8px_rgba(51,31,23,0.05)]">
          91 / 100
        </span>
      </div>

      {/* Rubric rows with sliding focus highlight */}
      <div className="relative space-y-2.5">
        <div className="bento-review-scan pointer-events-none absolute inset-x-0 top-0 h-9 rounded-lg bg-[#E8710A]/10 ring-1 ring-[#E8710A]/20" />

        {RUBRIC_CRITERIA.map((item) => (
          <div
            key={item.label}
            className="relative z-10 rounded-lg px-2 py-1"
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-[#331F17]">{item.label}</span>
              <span className="font-mono font-bold text-[#7A1F14] tabular-nums">
                {item.score}
              </span>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-clip rounded-full bg-[#7A1F14]/10">
              <div
                className={`bento-rubric-bar ${item.animClass} ${item.widthClass} ${item.barClass} h-full rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedbackLoopIllustration() {
  return (
    <div
      aria-hidden="true"
      className="bento-stage relative flex min-h-52 flex-col justify-center overflow-clip rounded-xl border border-[#7A1F14]/10 bg-[#FFF9F4] p-3.5 sm:p-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-0">
        {/* v1 Application Draft */}
        <div className="relative rounded-xl border border-[#7A1F14]/12 bg-white p-2.5 shadow-[0_6px_18px_rgba(51,31,23,0.04)] sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#7F5E4E]">
              <FileText className="block h-3 w-3 text-[#7A1F14]/65" />
              v1
            </span>
            <span className="rounded-full bg-[#FFF1E4] px-1.5 py-0.5 text-[9px] font-bold text-[#7C3D00]">
              Notes
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[#331F17]/12" />
            <div className="h-1.5 w-4/5 rounded-full bg-[#331F17]/12" />
            {/* Highlighted line needing revision */}
            <div className="rounded bg-[#FFF1E4] px-1.5 py-1 ring-1 ring-[#E8710A]/30">
              <div className="h-1.5 w-3/4 rounded-full bg-[#E8710A]/75" />
            </div>
          </div>

          {/* Floating reviewer annotation callout */}
          <div className="bento-feedback-note mt-2.5 rounded-md border border-[#E8710A]/30 bg-[#FFF5EB] px-2 py-1 text-[10px] font-semibold leading-tight text-[#7C3D00]">
            Add 12-mo cash flow
          </div>
        </div>

        {/* Crisp Horizontal Flow Connector */}
        <div className="relative flex w-8 items-center justify-center sm:w-11">
          <svg
            viewBox="0 0 44 20"
            fill="none"
            className="block h-5 w-full"
          >
            <line
              x1="0"
              y1="10"
              x2="38"
              y2="10"
              stroke="#7A1F14"
              strokeOpacity="0.26"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M33.5 5.5 L39 10 L33.5 14.5"
              stroke="#E8710A"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* v2 Improved Application */}
        <div className="bento-feedback-v2 relative rounded-xl border border-[#16803C]/30 bg-white p-2.5 shadow-[0_8px_22px_rgba(22,128,60,0.08)] sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#7A1F14]">
              <FileText className="block h-3 w-3 text-[#16803C]" />
              v2
            </span>
            <span className="bento-feedback-badge inline-flex items-center gap-0.5 rounded-full bg-[#E8F5ED] px-1.5 py-0.5 text-[9px] font-bold text-[#14532D]">
              <Check className="block h-2.5 w-2.5 stroke-[2.8]" />
              Ready
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[#331F17]/14" />
            <div className="h-1.5 w-4/5 rounded-full bg-[#331F17]/14" />
            {/* Newly completed section */}
            <div className="rounded bg-[#E8F5ED]/75 px-1.5 py-1 ring-1 ring-[#16803C]/25">
              <div className="bento-feedback-fill h-1.5 w-full rounded-full bg-[#16803C]" />
            </div>
          </div>

          <p className="mt-2.5 text-[10px] font-semibold leading-tight text-[#14532D]">
            Resubmitted in portal
          </p>
        </div>
      </div>

      {/* Bottom continuity pill */}
      <div className="mt-3 flex items-center justify-between border-t border-[#7A1F14]/10 pt-2.5 text-[10px] font-medium text-[#7F5E4E]">
        <span>Same tracking code</span>
        <span className="font-semibold text-[#7A1F14]">No restart needed</span>
      </div>
    </div>
  );
}

export function AdvisorChatIllustration() {
  return (
    <div
      aria-hidden="true"
      className="bento-stage relative flex min-h-52 flex-col justify-between gap-3 overflow-clip rounded-xl border border-[#7A1F14]/10 bg-[#FFF9F4] p-4"
    >
      {/* Advisor Desk Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#7A1F14]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#7A1F14] text-xs font-bold text-white">
            KB
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="bento-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold leading-tight text-[#331F17]">
              Kabo · CEDA Advisor
            </p>
            <p className="text-[10px] font-medium text-[#7F5E4E]">
              Support Desk
            </p>
          </div>
        </div>
      
      </div>

      {/* Live Conversation Bubbles */}
      <div className="relative flex flex-col gap-3 py-0.5">
        {/* Applicant question */}
        <div className="bento-chat-msg-1 ml-auto max-w-[min(85%,24rem)] rounded-2xl rounded-br-sm bg-[#7A1F14] px-3.5 py-2 text-xs leading-relaxed text-white shadow-[0_6px_16px_rgba(122,31,20,0.18)]">
          Which documents do I need before submitting?
        </div>

        {/* Reply slot: typing indicator crossfades cleanly into advisor reply with zero dead gap */}
        <div className="relative">
          <div className="bento-chat-typing pointer-events-none absolute left-0 top-0 z-10 flex w-fit items-center gap-1 rounded-full border border-[#7A1F14]/12 bg-white px-3 py-2 shadow-xs">
            <span className="bento-typing-dot-1 h-1.5 w-1.5 rounded-full bg-[#7A1F14]/55" />
            <span className="bento-typing-dot-2 h-1.5 w-1.5 rounded-full bg-[#7A1F14]/55" />
            <span className="bento-typing-dot-3 h-1.5 w-1.5 rounded-full bg-[#7A1F14]/55" />
          </div>

          <div className="bento-chat-msg-2 mr-auto max-w-[min(94%,28rem)] rounded-2xl rounded-bl-sm border border-[#7A1F14]/12 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-[#331F17] shadow-[0_6px_18px_rgba(51,31,23,0.05)]">
            <p>
              Upload your CIPA company extract and Omang copy. I can also help check
              your eligibility right now.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#7A1F14]/12 bg-[#FFF9F4] px-2 py-1 text-[10px] font-semibold text-[#7A1F14]">
              <FileText className="block h-3 w-3 text-[#E8710A]" />
              <span>CEDA-Prep-Checklist.pdf</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
