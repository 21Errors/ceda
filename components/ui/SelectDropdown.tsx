"use client";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/cn";

export interface SelectDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectDropdownProps {
  id?: string;
  groupLabel: string;
  value: string;
  placeholder?: string;
  options: readonly SelectDropdownOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}

/**
 * Full-width form select built on our custom accessible DropdownMenu so form
 * selects stay visually consistent with text inputs across browsers.
 */
export function SelectDropdown({
  id,
  groupLabel,
  value,
  placeholder = "Choose an option",
  options,
  onChange,
  invalid = false,
  className,
}: SelectDropdownProps) {
  const selected = options.find((option) => option.value === value);
  const triggerLabel = selected?.label ?? placeholder;

  return (
    <div id={id} className={cn("w-full", className)}>
      <DropdownMenu
        label={triggerLabel}
        ariaLabel={`${groupLabel}: ${triggerLabel}`}
        variant="field"
        align="start"
        className="w-full"
        triggerClassName={cn(
          !selected && "text-ceda-muted",
          invalid && "border-(--status-danger-border) bg-(--status-danger-bg)",
        )}
        menuClassName="max-h-64 min-w-52 overflow-y-auto"
        items={[
          {
            type: "radio-group",
            id: `${groupLabel.toLowerCase().replace(/\s+/g, "-")}-options`,
            label: groupLabel,
            value,
            options,
            onValueChange: onChange,
          },
        ]}
      />
    </div>
  );
}
