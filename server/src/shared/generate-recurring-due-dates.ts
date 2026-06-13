import type { RecurrenceRule } from "@fluxor/contracts";

const MIN_RECURRENCE_INTERVAL = 1;
const MAX_RECURRENCE_INTERVAL = 60;
const MIN_RECURRENCE_OCCURRENCES = 2;
const MAX_RECURRENCE_OCCURRENCES = 60;
const MAX_SCAN_DAYS = 366 * 30;

interface ParsedIsoDate {
  year: number;
  month: number;
  day: number;
}

function parseIsoDate(iso: string): ParsedIsoDate {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function compareIsoDate(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function addDays(iso: string, daysToAdd: number): string {
  const { year, month, day } = parseIsoDate(iso);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);

  return formatIsoDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function getWeekday(iso: string): number {
  const { year, month, day } = parseIsoDate(iso);
  return new Date(year, month - 1, day).getDay();
}

function getMondayWeekStart(iso: string): string {
  const weekday = getWeekday(iso);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(iso, -daysFromMonday);
}

function weeksBetween(startIso: string, endIso: string): number {
  const startMonday = getMondayWeekStart(startIso);
  const endMonday = getMondayWeekStart(endIso);
  const { year, month, day } = parseIsoDate(startMonday);
  const startDate = new Date(year, month - 1, day);
  const endParts = parseIsoDate(endMonday);
  const endDate = new Date(endParts.year, endParts.month - 1, endParts.day);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function monthDateAtOffset(
  anchor: ParsedIsoDate,
  monthOffset: number,
  monthDay: number,
): string {
  const totalMonths = anchor.year * 12 + (anchor.month - 1) + monthOffset;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(monthDay, daysInMonth(year, month));

  return formatIsoDate(year, month, day);
}

function yearDateAtOffset(
  anchor: ParsedIsoDate,
  yearOffset: number,
): string {
  const year = anchor.year + yearOffset;
  const day = Math.min(anchor.day, daysInMonth(year, anchor.month));

  return formatIsoDate(year, anchor.month, day);
}

function resolveWeekDays(rule: RecurrenceRule, startDate: string): number[] {
  if (rule.weekDays && rule.weekDays.length > 0) {
    return [...new Set(rule.weekDays)].sort((left, right) => left - right);
  }

  return [getWeekday(startDate)];
}

function shouldStop(
  dates: string[],
  candidate: string,
  rule: RecurrenceRule,
): boolean {
  if (rule.end.type === "count") {
    return dates.length >= rule.end.count;
  }

  return compareIsoDate(candidate, rule.end.date) > 0;
}

function pushDate(
  dates: string[],
  candidate: string,
  startDate: string,
  rule: RecurrenceRule,
): boolean {
  if (compareIsoDate(candidate, startDate) < 0) {
    return false;
  }

  if (rule.end.type === "until" && compareIsoDate(candidate, rule.end.date) > 0) {
    return true;
  }

  dates.push(candidate);
  return shouldStop(dates, candidate, rule);
}

function generateDailyDates(startDate: string, rule: RecurrenceRule): string[] {
  const dates: string[] = [];
  let index = 0;

  while (index < MAX_SCAN_DAYS) {
    const candidate = addDays(startDate, index * rule.interval);
    if (pushDate(dates, candidate, startDate, rule)) {
      break;
    }
    index += 1;
  }

  return dates;
}

function generateWeeklyDates(startDate: string, rule: RecurrenceRule): string[] {
  const dates: string[] = [];
  const weekDays = resolveWeekDays(rule, startDate);
  const anchorWeekStart = getMondayWeekStart(startDate);
  let scanned = 0;
  let current = startDate;

  while (scanned < MAX_SCAN_DAYS) {
    const weekIndex = weeksBetween(anchorWeekStart, current);

    if (weekIndex % rule.interval === 0 && weekDays.includes(getWeekday(current))) {
      if (pushDate(dates, current, startDate, rule)) {
        break;
      }
    }

    current = addDays(current, 1);
    scanned += 1;
  }

  return dates;
}

function generateMonthlyDates(startDate: string, rule: RecurrenceRule): string[] {
  if (rule.monthWeekdayPosition != null || rule.monthWeekday != null) {
    throw new Error("Recorrência por dia da semana no mês ainda não suportada");
  }

  const monthDay = rule.monthDay ?? parseIsoDate(startDate).day;
  const anchor = parseIsoDate(startDate);
  const dates: string[] = [];
  let monthOffset = 0;
  let safety = 0;

  while (monthOffset < MAX_RECURRENCE_OCCURRENCES * rule.interval + 12) {
    const candidate = monthDateAtOffset(anchor, monthOffset, monthDay);

    if (compareIsoDate(candidate, startDate) >= 0) {
      if (pushDate(dates, candidate, startDate, rule)) {
        break;
      }
    }

    monthOffset += rule.interval;
    safety += 1;
    if (safety > MAX_SCAN_DAYS) {
      break;
    }
  }

  return dates;
}

function generateYearlyDates(startDate: string, rule: RecurrenceRule): string[] {
  const anchor = parseIsoDate(startDate);
  const dates: string[] = [];
  let yearOffset = 0;
  let safety = 0;

  while (yearOffset < MAX_RECURRENCE_OCCURRENCES * rule.interval + 5) {
    const candidate = yearDateAtOffset(anchor, yearOffset);

    if (compareIsoDate(candidate, startDate) >= 0) {
      if (pushDate(dates, candidate, startDate, rule)) {
        break;
      }
    }

    yearOffset += rule.interval;
    safety += 1;
    if (safety > MAX_SCAN_DAYS) {
      break;
    }
  }

  return dates;
}

export function validateRecurrenceRule(rule: RecurrenceRule): void {
  if (
    !Number.isInteger(rule.interval) ||
    rule.interval < MIN_RECURRENCE_INTERVAL ||
    rule.interval > MAX_RECURRENCE_INTERVAL
  ) {
    throw new Error(
      `Intervalo deve ser entre ${MIN_RECURRENCE_INTERVAL} e ${MAX_RECURRENCE_INTERVAL}`,
    );
  }

  if (rule.frequency === "weekly") {
    if (rule.weekDays) {
      for (const weekday of rule.weekDays) {
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
          throw new Error("Dia da semana inválido");
        }
      }
    }
  }

  if (rule.frequency === "monthly") {
    const monthDay = rule.monthDay ?? 1;
    if (!Number.isInteger(monthDay) || monthDay < 1 || monthDay > 31) {
      throw new Error("Dia do mês deve ser entre 1 e 31");
    }

    if (rule.monthWeekdayPosition != null || rule.monthWeekday != null) {
      throw new Error("Recorrência por dia da semana no mês ainda não suportada");
    }
  }

  if (rule.end.type === "count") {
    if (
      !Number.isInteger(rule.end.count) ||
      rule.end.count < MIN_RECURRENCE_OCCURRENCES ||
      rule.end.count > MAX_RECURRENCE_OCCURRENCES
    ) {
      throw new Error(
        `Quantidade de ocorrências deve ser entre ${MIN_RECURRENCE_OCCURRENCES} e ${MAX_RECURRENCE_OCCURRENCES}`,
      );
    }
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.end.date)) {
    throw new Error("Data final inválida");
  }
}

export function generateRecurringDueDates(
  startDate: string,
  rule: RecurrenceRule,
): string[] {
  validateRecurrenceRule(rule);

  if (rule.end.type === "count" && rule.end.count < 1) {
    return [];
  }

  switch (rule.frequency) {
    case "daily":
      return generateDailyDates(startDate, rule);
    case "weekly":
      return generateWeeklyDates(startDate, rule);
    case "monthly":
      return generateMonthlyDates(startDate, rule);
    case "yearly":
      return generateYearlyDates(startDate, rule);
    default:
      throw new Error("Frequência de recorrência inválida");
  }
}
