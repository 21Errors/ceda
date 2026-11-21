import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: "burgundy" | "orange" | "peach";
  accentBar?: boolean;
  children: ReactNode;
}

const eyebrowTones = {
  burgundy: "text-ceda-burgundy",
  orange: "text-ceda-orange",
  peach: "text-ceda-peach",
};

export function Eyebrow({
  tone = "burgundy",
  accentBar = false,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-xs font-extrabold uppercase tracking-[0.18em]",
        eyebrowTones[tone],
        accentBar && "border-s-[3px] border-ceda-burgundy ps-ds-4",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export type HeadingLevel = "h1" | "h2" | "h3" | "h4";
export type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";

const headingSizes: Record<HeadingSize, string> = {
  display: "text-[clamp(2.25rem,5vw,4.25rem)] font-black leading-[0.98] tracking-tight",
  h1: "text-[clamp(1.875rem,3.4vw,2.75rem)] font-extrabold leading-[1.12] tracking-tight",
  h2: "text-[clamp(1.4rem,2.4vw,1.95rem)] font-bold leading-[1.2] tracking-tight",
  h3: "text-lg font-bold leading-snug sm:text-xl",
  h4: "text-base font-bold leading-snug",
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  size?: HeadingSize;
  inverted?: boolean;
  children: ReactNode;
}

export function Heading({
  as = "h2",
  size,
  inverted = false,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = as;
  const resolvedSize = size ?? as;

  return (
    <Tag
      className={cn(
        headingSizes[resolvedSize],
        inverted ? "text-white" : "text-ceda-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export type TextVariant = "lead" | "body" | "muted" | "caption" | "mono";

const textVariants: Record<TextVariant, string> = {
  lead: "text-base leading-7 text-ceda-body sm:text-lg sm:leading-8",
  body: "text-sm leading-6 text-ceda-body sm:text-[0.95rem] sm:leading-7",
  muted: "text-sm leading-6 text-ceda-muted",
  caption: "text-xs leading-5 text-ceda-muted",
  mono: "font-mono text-xs leading-5 text-ceda-ink",
};

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  inverted?: boolean;
  children: ReactNode;
}

export function Text({
  variant = "body",
  inverted = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <p
      className={cn(
        textVariants[variant],
        inverted && (variant === "muted" || variant === "caption" ? "text-white/75" : "text-white/90"),
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export interface PageHeaderProps {
  eyebrow?: string;
  eyebrowTone?: "burgundy" | "orange" | "peach";
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowTone = "burgundy",
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-ds-5", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-ds-2 text-sm font-semibold text-ceda-burgundy underline decoration-ceda-burgundy/40 underline-offset-4 transition hover:text-ceda-burgundy-dark hover:decoration-ceda-burgundy focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span>{backLabel}</span>
        </Link>
      ) : null}

      <div className="flex flex-col gap-ds-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow> : null}
          <Heading as="h1" className={eyebrow ? "mt-ds-2" : undefined}>
            {title}
          </Heading>
          {description ? (
            <Text variant="lead" className="mt-ds-3">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-cluster">{actions}</div> : null}
      </div>
    </header>
  );
}
