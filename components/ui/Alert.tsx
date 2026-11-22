"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger" | "brand";

const alertStyles: Record<AlertTone, { container: string; iconColor: string; Icon: typeof Info }> = {
  info: {
    container: "border-[var(--status-info-border)]/35 bg-[var(--status-info-bg)] text-[var(--status-info-ink)]",
    iconColor: "text-[var(--status-info-border)]",
    Icon: Info,
  },
  success: {
    container: "border-[var(--status-success-border)]/35 bg-[var(--status-success-bg)] text-[var(--status-success-ink)]",
    iconColor: "text-[var(--status-success-border)]",
    Icon: CheckCircle2,
  },
  warning: {
    container: "border-[var(--status-warning-border)]/35 bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)]",
    iconColor: "text-[var(--status-warning-border)]",
    Icon: AlertTriangle,
  },
  danger: {
    container: "border-[var(--status-danger-border)]/40 bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)]",
    iconColor: "text-[var(--status-danger-border)]",
    Icon: AlertCircle,
  },
  brand: {
    container: "border-ceda-line bg-ceda-cream text-ceda-body",
    iconColor: "text-ceda-burgundy",
    Icon: Sparkles,
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  tone = "info",
  title,
  children,
  action,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { container, iconColor, Icon } = alertStyles[tone];
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-ds-3 rounded-control border p-ds-4 text-sm leading-6",
        container,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 h-5 w-5 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-bold leading-snug">{title}</p> : null}
        <div className={title ? "mt-1" : undefined}>{children}</div>
        {action ? <div className="mt-ds-3">{action}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          aria-label="Dismiss notice"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-card border border-dashed border-ceda-line bg-ceda-cream/45 px-card py-ds-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ceda-cream-mid text-ceda-burgundy"
      >
        {icon}
      </span>
      <h3 className="mt-ds-4 text-base font-bold text-ceda-ink">{title}</h3>
      <p className="mt-ds-2 max-w-md text-sm leading-6 text-ceda-muted">{description}</p>
      {action ? <div className="mt-ds-5">{action}</div> : null}
    </div>
  );
}

export interface SkeletonProps {
  variant?: "text" | "rect" | "circle";
  className?: string;
}

export function Skeleton({ variant = "rect", className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-neutral-200/80 motion-safe:animate-pulse",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "rect" && "h-24 w-full rounded-card",
        variant === "circle" && "h-12 w-12 rounded-full",
        className,
      )}
    />
  );
}
