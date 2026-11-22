export const DEFAULT_MAX_CONCURRENT_CHATS_PER_AGENT = 3;

export type DeskAvailabilityStatus =
  | "open"
  | "busy"
  | "offline_hours"
  | "public_holiday";

export interface DeskAvailability {
  status: DeskAvailabilityStatus;
  isOpen: boolean;
  allAgentsBusy: boolean;
  holidayName: string | null;
  waitingCount: number;
  activeChatsCount: number;
  totalConsultants: number;
  availableConsultants: number;
  maxConcurrentPerAgent: number;
  hoursLabel: string;
  bannerMessage: string | null;
}

const FIXED_BOTSWANA_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "01-02": "Public Holiday",
  "05-01": "Labour Day",
  "07-01": "Sir Seretse Khama Day",
  "09-30": "Botswana Day",
  "10-01": "Public Holiday (Botswana Day)",
  "12-25": "Christmas Day",
  "12-26": "Boxing Day",
};

/**
 * Computes Gregorian Easter Sunday (month 1-12, day 1-31) using the
 * Meeus/Jones/Butcher algorithm so Good Friday, Easter Monday, and Ascension Day
 * are automatically recognized every year.
 */
function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function toIsoDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addUtcDays(year: number, month: number, day: number, delta: number): string {
  const dt = new Date(Date.UTC(year, month - 1, day + delta));
  return toIsoDateUTC(dt);
}

/**
 * Botswana President's Day falls on the third Monday of July, followed by
 * a public holiday on the Tuesday after.
 */
function getPresidentsDayDates(year: number): { monday: string; tuesday: string } {
  const julyFirst = new Date(Date.UTC(year, 6, 1));
  const dayOfWeek = julyFirst.getUTCDay(); // 0=Sun, 1=Mon
  const firstMonday = dayOfWeek === 1 ? 1 : dayOfWeek === 0 ? 2 : 9 - dayOfWeek;
  const thirdMonday = firstMonday + 14;
  return {
    monday: addUtcDays(year, 7, thirdMonday, 0),
    tuesday: addUtcDays(year, 7, thirdMonday, 1),
  };
}

export function getBotswanaHolidayName(
  isoDate: string,
  extraHolidays: ReadonlyMap<string, string> = new Map(),
): string | null {
  if (extraHolidays.has(isoDate)) {
    return extraHolidays.get(isoDate) ?? "Public Holiday";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const monthDay = `${match[2]}-${match[3]}`;

  if (FIXED_BOTSWANA_HOLIDAYS[monthDay]) {
    return FIXED_BOTSWANA_HOLIDAYS[monthDay];
  }

  const easter = getEasterSunday(year);
  if (isoDate === addUtcDays(year, easter.month, easter.day, -2)) {
    return "Good Friday";
  }
  if (isoDate === addUtcDays(year, easter.month, easter.day, 1)) {
    return "Easter Monday";
  }
  if (isoDate === addUtcDays(year, easter.month, easter.day, 39)) {
    return "Ascension Day";
  }

  const presidents = getPresidentsDayDates(year);
  if (isoDate === presidents.monday) return "President's Day";
  if (isoDate === presidents.tuesday) return "President's Day Holiday";

  return null;
}

export function getGaboroneClock(now: Date = new Date()): {
  isoDate: string;
  weekday: string;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Gaborone",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? -1);

  return { isoDate: `${year}-${month}-${day}`, weekday, hour };
}

export interface EvaluateAvailabilityInput {
  now?: Date;
  totalConsultants: number;
  activeByConsultant: ReadonlyMap<string, number>;
  waitingCount: number;
  maxConcurrentPerAgent?: number;
  extraHolidays?: ReadonlyMap<string, string>;
}

export function evaluateDeskAvailability(
  input: EvaluateAvailabilityInput,
): DeskAvailability {
  const maxConcurrent = Math.max(
    1,
    input.maxConcurrentPerAgent ?? DEFAULT_MAX_CONCURRENT_CHATS_PER_AGENT,
  );
  const { isoDate, weekday, hour } = getGaboroneClock(input.now);
  const holidayName = getBotswanaHolidayName(isoDate, input.extraHolidays);
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  const isBusinessHour = hour >= 9 && hour < 16;

  let activeChatsCount = 0;
  let busyConsultants = 0;
  for (const active of input.activeByConsultant.values()) {
    activeChatsCount += active;
    if (active >= maxConcurrent) busyConsultants += 1;
  }

  const availableConsultants = Math.max(
    0,
    input.totalConsultants - busyConsultants,
  );
  const hoursLabel = "09:00–16:00 CAT, weekdays";

  if (holidayName) {
    return {
      status: "public_holiday",
      isOpen: false,
      allAgentsBusy: false,
      holidayName,
      waitingCount: input.waitingCount,
      activeChatsCount,
      totalConsultants: input.totalConsultants,
      availableConsultants: 0,
      maxConcurrentPerAgent: maxConcurrent,
      hoursLabel,
      bannerMessage: `The service desk is closed today for ${holidayName}. Leave a message and a CEDA consultant will respond on the next working day (${hoursLabel}).`,
    };
  }

  if (!isWeekday || !isBusinessHour) {
    return {
      status: "offline_hours",
      isOpen: false,
      allAgentsBusy: false,
      holidayName: null,
      waitingCount: input.waitingCount,
      activeChatsCount,
      totalConsultants: input.totalConsultants,
      availableConsultants: 0,
      maxConcurrentPerAgent: maxConcurrent,
      hoursLabel,
      bannerMessage: `The service desk is currently offline (${hoursLabel}). Messages are saved to the consultant queue for the next working day.`,
    };
  }

  const allAgentsBusy =
    input.totalConsultants === 0 || availableConsultants === 0;

  if (allAgentsBusy) {
    const queueNote =
      input.waitingCount > 0
        ? ` (${input.waitingCount} ${input.waitingCount === 1 ? "applicant" : "applicants"} currently queued)`
        : "";
    return {
      status: "busy",
      isOpen: true,
      allAgentsBusy: true,
      holidayName: null,
      waitingCount: input.waitingCount,
      activeChatsCount,
      totalConsultants: input.totalConsultants,
      availableConsultants: 0,
      maxConcurrentPerAgent: maxConcurrent,
      hoursLabel,
      bannerMessage: `All CEDA service consultants are currently assisting other applicants${queueNote}. Your messages are saved and the next available consultant will join shortly.`,
    };
  }

  return {
    status: "open",
    isOpen: true,
    allAgentsBusy: false,
    holidayName: null,
    waitingCount: input.waitingCount,
    activeChatsCount,
    totalConsultants: input.totalConsultants,
    availableConsultants,
    maxConcurrentPerAgent: maxConcurrent,
    hoursLabel,
    bannerMessage: null,
  };
}
