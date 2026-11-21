import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ContainerSize = "narrow" | "content" | "shell" | "workspace";

const containerMaxWidths: Record<ContainerSize, string> = {
  narrow: "max-w-[var(--container-narrow)]",
  content: "max-w-[var(--container-content)]",
  shell: "max-w-[var(--container-shell)]",
  workspace: "max-w-[var(--container-workspace)]",
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: ReactNode;
}

export function Container({ size = "shell", className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-gutter", containerMaxWidths[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export type SectionSpacing = "none" | "sm" | "md" | "lg";
export type SectionSurface = "white" | "muted" | "cream" | "brand";

const sectionSpacings: Record<SectionSpacing, string> = {
  none: "",
  sm: "py-section-sm",
  md: "py-section",
  lg: "py-section-lg",
};

const sectionSurfaces: Record<SectionSurface, string> = {
  white: "bg-white text-ceda-body",
  muted: "bg-surface-muted text-ceda-body",
  cream: "bg-ceda-cream text-ceda-body",
  brand: "bg-gradient-to-br from-ceda-burgundy-dark via-ceda-burgundy to-[#3E120D] text-white",
};

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing;
  surface?: SectionSurface;
  bordered?: boolean;
  children: ReactNode;
}

export function Section({
  spacing = "md",
  surface = "white",
  bordered = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        sectionSpacings[spacing],
        sectionSurfaces[surface],
        bordered && "border-b border-ceda-line",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";

const stackGaps: Record<StackGap, string> = {
  xs: "gap-stack-xs",
  sm: "gap-stack-sm",
  md: "gap-stack",
  lg: "gap-stack-lg",
  xl: "gap-stack-xl",
};

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: StackGap;
  children: ReactNode;
}

export function Stack({ gap = "md", className, children, ...props }: StackProps) {
  return (
    <div className={cn("flex flex-col", stackGaps[gap], className)} {...props}>
      {children}
    </div>
  );
}

export type ClusterGap = "xs" | "sm" | "md" | "lg";

const clusterGaps: Record<ClusterGap, string> = {
  xs: "gap-cluster-xs",
  sm: "gap-cluster-sm",
  md: "gap-cluster",
  lg: "gap-cluster-lg",
};

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  gap?: ClusterGap;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  nowrap?: boolean;
  children: ReactNode;
}

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function Cluster({
  gap = "md",
  align = "center",
  justify = "start",
  nowrap = false,
  className,
  children,
  ...props
}: ClusterProps) {
  return (
    <div
      className={cn(
        "flex",
        nowrap ? "flex-nowrap" : "flex-wrap",
        clusterGaps[gap],
        alignMap[align],
        justifyMap[justify],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type GridCols = 1 | 2 | 3 | 4 | "auto";
export type GridGap = "sm" | "md" | "lg";

const gridColsMap: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  auto: "grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]",
};

const gridGapsMap: Record<GridGap, string> = {
  sm: "gap-ds-4",
  md: "gap-ds-6",
  lg: "gap-ds-8",
};

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  gap?: GridGap;
  children: ReactNode;
}

export function Grid({ cols = 3, gap = "md", className, children, ...props }: GridProps) {
  return (
    <div className={cn("grid", gridColsMap[cols], gridGapsMap[gap], className)} {...props}>
      {children}
    </div>
  );
}

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Divider({ label, className, ...props }: DividerProps) {
  if (!label) {
    return <hr className={cn("border-0 border-t border-ceda-line", className)} />;
  }

  return (
    <div
      role="separator"
      aria-label={label}
      className={cn("flex items-center gap-ds-4 text-xs font-semibold uppercase tracking-[0.14em] text-ceda-muted", className)}
      {...props}
    >
      <span className="h-px flex-1 bg-ceda-line" aria-hidden="true" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-ceda-line" aria-hidden="true" />
    </div>
  );
}
