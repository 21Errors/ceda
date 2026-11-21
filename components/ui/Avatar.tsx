import { cn } from "@/lib/cn";

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarTone = "burgundy" | "orange" | "cream";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-9 w-9 text-xs rounded-full",
  md: "h-11 w-11 text-sm rounded-full",
  lg: "h-14 w-14 text-lg rounded-2xl",
};

const toneClasses: Record<AvatarTone, string> = {
  burgundy: "bg-ceda-burgundy text-white",
  orange: "bg-ceda-orange text-white",
  cream: "bg-ceda-cream-mid text-ceda-burgundy border border-ceda-line",
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}

export function Avatar({ name, size = "md", tone = "burgundy", className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold tracking-tight select-none",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
