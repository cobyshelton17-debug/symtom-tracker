const formatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

export function getTimeZone(): string {
  const configured = process.env.APP_TIMEZONE?.trim();
  if (configured) return configured;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function localDateKey(date: Date, timeZone: string = getTimeZone()): string {
  return dateFormatter(timeZone).format(date);
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const HOUR = 60 * 60 * 1000;

export function utcWindowForDay(year: number, month: number, day: number): { start: Date; end: Date } {
  const estimate = Date.UTC(year, month - 1, day);
  return { start: new Date(estimate - 48 * HOUR), end: new Date(estimate + 48 * HOUR) };
}

export function utcWindowForMonth(year: number, month: number): { start: Date; end: Date } {
  const start = Date.UTC(year, month - 1, 1);
  const next = Date.UTC(year, month, 1);
  return { start: new Date(start - 48 * HOUR), end: new Date(next + 48 * HOUR) };
}

export function utcWindowForYear(year: number): { start: Date; end: Date } {
  const start = Date.UTC(year, 0, 1);
  const next = Date.UTC(year + 1, 0, 1);
  return { start: new Date(start - 48 * HOUR), end: new Date(next + 48 * HOUR) };
}

export function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: getTimeZone(),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: getTimeZone(),
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
