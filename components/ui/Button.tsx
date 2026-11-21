import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const baseClasses =
  "inline-flex cursor-pointer items-center justify-center gap-ds-2 rounded-full font-bold whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange disabled:cursor-not-allowed disabled:opacity-55 active:not-disabled:scale-[0.98]";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ceda-burgundy text-white shadow-sm hover:not-disabled:bg-ceda-burgundy-dark hover:not-disabled:shadow-md",
  secondary:
    "border border-ceda-line bg-white text-ceda-burgundy shadow-xs hover:not-disabled:border-ceda-burgundy/40 hover:not-disabled:bg-ceda-cream",
  accent:
    "bg-ceda-orange text-white shadow-sm hover:not-disabled:bg-[#CF6307] hover:not-disabled:shadow-md",
  ghost:
    "bg-transparent text-ceda-ink hover:not-disabled:bg-ceda-cream hover:not-disabled:text-ceda-burgundy",
  danger:
    "bg-[#B42318] text-white shadow-sm hover:not-disabled:bg-[#911B12]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-ds-4 text-xs",
  md: "min-h-11 px-ds-6 text-sm",
  lg: "min-h-12 px-ds-8 text-sm sm:text-base",
  icon: "h-11 w-11 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {!loading && rightIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  external?: boolean;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  external = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {leftIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {rightIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} {...props}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {content}
    </Link>
  );
}
