import type { HTMLAttributes, ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  FileEdit,
  RotateCcw,
  Send,
  Trophy,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type BadgeTone = "brand" | "orange" | "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  brand: "border-ceda-burgundy/20 bg-ceda-burgundy/[0.08] text-ceda-burgundy",
  orange: "border-ceda-orange/25 bg-ceda-cream-mid text-ceda-ink",
  neutral: "border-slate-200 bg-surface-muted text-ceda-body",
  success: "border-[#16803C]/25 bg-[var(--status-success-bg)] text-[var(--status-success-ink)]",
  warning: "border-[#C56500]/25 bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)]",
  danger: "border-[#B42318]/25 bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)]",
  info: "border-[#315EDB]/25 bg-[var(--status-info-bg)] text-[var(--status-info-ink)]",
};

const dotClasses: Record<BadgeTone, string> = {
  brand: "bg-ceda-burgundy",
  orange: "bg-ceda-orange",
  neutral: "bg-ceda-muted",
  success: "bg-[#16803C]",
  warning: "bg-[#C56500]",
  danger: "bg-[#B42318]",
  info: "bg-[#315EDB]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  tone = "brand",
  size = "md",
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-ds-2 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClasses[tone])} /> : null}
      {icon ? <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

export type IdeaLifecycleStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "awarded"
  | "rejected"
  | "withdrawn";

const statusMap: Record<IdeaLifecycleStatus, { label: string; tone: BadgeTone; Icon: typeof Clock3 }> = {
  draft: { label: "Draft", tone: "neutral", Icon: FileEdit },
  submitted: { label: "Submitted", tone: "orange", Icon: Send },
  in_review: { label: "In review", tone: "info", Icon: Clock3 },
  changes_requested: { label: "Changes requested", tone: "warning", Icon: RotateCcw },
  approved: { label: "Approved", tone: "success", Icon: CheckCircle2 },
  awarded: { label: "Awarded", tone: "brand", Icon: Trophy },
  rejected: { label: "Not selected", tone: "danger", Icon: XCircle },
  withdrawn: { label: "Withdrawn", tone: "neutral", Icon: XCircle },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const mapped = statusMap[status as IdeaLifecycleStatus];
  if (!mapped) {
    return (
      <Badge tone="neutral" dot className={cn("capitalize", className)}>
        {status.replaceAll("_", " ")}
      </Badge>
    );
  }

  const Icon = mapped.Icon;
  return (
    <Badge tone={mapped.tone} icon={<Icon className="h-3.5 w-3.5" />} className={className}>
      {mapped.label}
    </Badge>
  );
}
