const PORTAL_TIME_ZONE = "Africa/Gaborone";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeZone: PORTAL_TIME_ZONE,
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: PORTAL_TIME_ZONE,
});

export function formatPortalDate(
  value: Date | null | undefined,
  fallback = "Not set",
): string {
  if (!value) return fallback;
  return DATE_FORMATTER.format(value);
}

export function formatPortalDateTime(
  value: Date | null | undefined,
  fallback = "Not set",
): string {
  if (!value) return fallback;
  return DATE_TIME_FORMATTER.format(value);
}

export function formatAuditAction(action: string): string {
  return action.replaceAll(".", " · ");
}
