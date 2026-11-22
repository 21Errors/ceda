export interface DateParts {
  year: number;
  month: number; // 0-indexed (0 = January .. 11 = December)
  day: number; // 1..31
  hour: number; // 0..23
  minute: number; // 0..59
}

export interface CalendarCell {
  year: number;
  month: number;
  day: number;
  isoDate: string;
  inCurrentMonth: boolean;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: String(hour).padStart(2, "0"),
}));

export const MINUTE_OPTIONS = [0, 15, 30, 45, 59].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function formatDateValue(parts: DateParts, includeTime: boolean): string {
  const datePart = toIsoDate(parts.year, parts.month, parts.day);
  if (!includeTime) return datePart;
  return `${datePart}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function parseDateValue(value: string, includeTime: boolean): DateParts | null {
  if (!value) return null;
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = includeTime && match[4] !== undefined ? Number(match[4]) : 0;
  const minute = includeTime && match[5] !== undefined ? Number(match[5]) : 0;

  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const check = new Date(year, month, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month ||
    check.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

export function extractIsoDate(value?: string): string | null {
  if (!value) return null;
  const parsed = parseDateValue(value, false);
  if (!parsed) return null;
  return toIsoDate(parsed.year, parsed.month, parsed.day);
}

export function formatDisplayDate(value: string, includeTime: boolean): string {
  const parsed = parseDateValue(value, includeTime);
  if (!parsed) return "";
  const dateLabel = `${parsed.day} ${SHORT_MONTH_NAMES[parsed.month]} ${parsed.year}`;
  if (!includeTime) return dateLabel;
  return `${dateLabel}, ${pad2(parsed.hour)}:${pad2(parsed.minute)}`;
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDate = new Date(year, month, 0);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  const daysInPrevMonth = prevMonthDate.getDate();

  const nextMonthDate = new Date(year, month + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

  const cells: CalendarCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    cells.push({
      year: prevYear,
      month: prevMonth,
      day,
      isoDate: toIsoDate(prevYear, prevMonth, day),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      year,
      month,
      day,
      isoDate: toIsoDate(year, month, day),
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      day: nextDay,
      isoDate: toIsoDate(nextYear, nextMonth, nextDay),
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function getTodayParts(): { year: number; month: number; day: number; isoDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return { year, month, day, isoDate: toIsoDate(year, month, day) };
}
