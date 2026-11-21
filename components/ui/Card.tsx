import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "elevated" | "warm" | "outlined" | "brand";
export type CardPadding = "none" | "sm" | "md" | "lg";

const cardVariants: Record<CardVariant, string> = {
  default: "border border-ceda-line bg-white shadow-xs",
  elevated: "border border-ceda-line bg-white shadow-card",
  warm: "border border-ceda-line bg-ceda-cream",
  outlined: "border border-ceda-burgundy/35 bg-white",
  brand: "border border-ceda-burgundy bg-gradient-to-br from-ceda-burgundy-dark via-ceda-burgundy to-[#3E120D] text-white shadow-brand",
};

const cardPaddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-card-sm",
  md: "p-card",
  lg: "p-card-lg",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        cardVariants[variant],
        cardPaddings[padding],
        interactive &&
          "transition-[transform,box-shadow,border-color,background-color] duration-150 hover:border-ceda-burgundy/40 hover:shadow-elevated",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-cluster border-b border-ceda-line px-card py-ds-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-cluster border-t border-ceda-line bg-ceda-cream/55 px-card py-ds-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type StatTone = "burgundy" | "orange" | "info" | "success";

const statIconTones: Record<StatTone, string> = {
  burgundy: "bg-[#F3E9E5] text-ceda-burgundy",
  orange: "bg-ceda-cream-mid text-[#C56500]",
  info: "bg-[var(--status-info-bg)] text-[#315EDB]",
  success: "bg-[var(--status-success-bg)] text-[#13844A]",
};

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: StatTone;
  delta?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  tone = "burgundy",
  delta,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-28 items-center gap-ds-4 rounded-card border border-ceda-line bg-white p-card-sm shadow-xs",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          statIconTones[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-ceda-ink">{value}</p>
        <p className="text-sm text-ceda-muted">{label}</p>
        {delta ? <p className="mt-0.5 text-xs font-semibold text-ceda-burgundy">{delta}</p> : null}
      </div>
    </article>
  );
}
