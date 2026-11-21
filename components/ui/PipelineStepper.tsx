import { Check, RotateCcw, Send, Search, MessageSquareText, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

export type PipelineStageKey = "submission" | "review" | "feedback" | "approval" | "award";

export interface PipelineStageDefinition {
  key: PipelineStageKey;
  label: string;
  description: string;
  Icon: typeof Send;
}

export const CEDA_PIPELINE_STAGES: readonly PipelineStageDefinition[] = [
  { key: "submission", label: "Submission", description: "Application & attachments logged", Icon: Send },
  { key: "review", label: "Review", description: "Weighted rubric evaluation", Icon: Search },
  { key: "feedback", label: "Feedback", description: "Revision & iteration cycle", Icon: MessageSquareText },
  { key: "approval", label: "Approval", description: "Adjudication panel decision", Icon: ShieldCheck },
  { key: "award", label: "Award", description: "Recognition & funding unlock", Icon: Trophy },
];

export interface PipelineStepperProps {
  currentStage: PipelineStageKey;
  changesRequested?: boolean;
  className?: string;
}

export function PipelineStepper({
  currentStage,
  changesRequested = false,
  className,
}: PipelineStepperProps) {
  const activeIndex = CEDA_PIPELINE_STAGES.findIndex((stage) => stage.key === currentStage);

  return (
    <div className={cn("ds-pipeline-host w-full", className)}>
      <ol
        aria-label="CEDA Innovation Lifecycle Pipeline"
        className="ds-pipeline-list"
      >
        {CEDA_PIPELINE_STAGES.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isRevision = isCurrent && changesRequested;
          const StageIcon = isCompleted ? Check : isRevision ? RotateCcw : stage.Icon;

          return (
            <li
              key={stage.key}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative flex items-start gap-ds-3 rounded-card border p-ds-4 transition-colors",
                isCompleted && "border-ceda-burgundy/25 bg-ceda-cream",
                isCurrent && !isRevision && "border-ceda-burgundy bg-white shadow-card ring-1 ring-ceda-burgundy/20",
                isRevision && "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]",
                !isCompleted && !isCurrent && "border-ceda-line bg-surface-muted/70 opacity-80",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                  isCompleted && "bg-ceda-burgundy text-white",
                  isCurrent && !isRevision && "bg-ceda-orange text-white shadow-xs",
                  isRevision && "bg-[var(--status-warning-border)] text-white",
                  !isCompleted && !isCurrent && "border border-ceda-line bg-white text-ceda-muted",
                )}
              >
                <StageIcon className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ceda-muted">
                  Stage 0{index + 1}
                </p>
                <p className="mt-0.5 text-sm font-bold text-ceda-ink">
                  {stage.label}
                  {isRevision ? (
                    <span className="ms-1.5 text-xs font-semibold text-[var(--status-warning-ink)]">
                      (Revision needed)
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs leading-5 text-ceda-muted">{stage.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
