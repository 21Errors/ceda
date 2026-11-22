import type { ReactNode } from "react";

export interface DropdownCommandItem {
  type?: "command";
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
}

export interface DropdownLinkItem {
  type: "link";
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  external?: boolean;
  disabled?: boolean;
}

export interface DropdownCheckboxItem {
  type: "checkbox";
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (nextChecked: boolean) => void;
}

export interface DropdownRadioGroupItem {
  type: "radio-group";
  id: string;
  label: string;
  value: string;
  options: readonly {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  onValueChange: (nextValue: string) => void;
}

export interface DropdownSubmenuItem {
  type: "submenu";
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  items: readonly DropdownMenuItem[];
}

export interface DropdownSeparatorItem {
  type: "separator";
  id: string;
}

export type DropdownMenuItem =
  | DropdownCommandItem
  | DropdownLinkItem
  | DropdownCheckboxItem
  | DropdownRadioGroupItem
  | DropdownSubmenuItem
  | DropdownSeparatorItem;

export interface DropdownMenuProps {
  label: string;
  triggerIcon?: ReactNode;
  hideChevron?: boolean;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "icon" | "field";
  align?: "start" | "end";
  items: readonly DropdownMenuItem[];
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}
