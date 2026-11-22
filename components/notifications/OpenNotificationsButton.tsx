"use client";

import { Bell } from "lucide-react";
import { useNotificationsModal } from "./NotificationsModalContext";

export function OpenNotificationsButton({
  label = "Notifications",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { openNotifications } = useNotificationsModal();

  return (
    <button
      type="button"
      onClick={openNotifications}
      className={
        className ??
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-ink transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
      }
    >
      <Bell aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
      <span>{label}</span>
    </button>
  );
}
