import type {
  CalendarDaySummary,
  CalendarWeek,
  FinancialCalendarData,
} from "./financial-calendar.types";

const WEEKDAY_LABELS = [
  "SEG",
  "TER",
  "QUA",
  "QUI",
  "SEX",
  "SAB",
  "DOM",
] as const;

interface CalendarRecord {
  type: "payable" | "receivable";
  status: string;
  date: string;
  expectedAmountCents: number;
}

function isCanceled(record: { status: string }): boolean {
  return record.status === "canceled";
}

function isSameMonth(
  date: string,
  year: number,
  month: number,
): boolean {
  const [recordYear, recordMonth] = date.split("-").map(Number);
  return recordYear === year && recordMonth === month;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMondayFirstOffset(year: number, month: number): number {
  const weekday = new Date(year, month - 1, 1).getDay();
  return (weekday + 6) % 7;
}

function getTodayIsoDate(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function buildDailySummariesByDate(
  records: CalendarRecord[],
  selectedMonth: number,
  selectedYear: number,
): Map<string, { receivableCents: number; payableCents: number }> {
  const summaries = new Map<
    string,
    { receivableCents: number; payableCents: number }
  >();

  for (const record of records) {
    if (isCanceled(record)) {
      continue;
    }

    if (!isSameMonth(record.date, selectedYear, selectedMonth)) {
      continue;
    }

    const entry = summaries.get(record.date) ?? {
      receivableCents: 0,
      payableCents: 0,
    };

    if (record.type === "receivable") {
      entry.receivableCents += record.expectedAmountCents;
    } else {
      entry.payableCents += record.expectedAmountCents;
    }

    summaries.set(record.date, entry);
  }

  return summaries;
}

export function calculateFinancialCalendar(
  records: CalendarRecord[],
  selectedMonth: number,
  selectedYear: number,
  todayIso: string = getTodayIsoDate(),
): FinancialCalendarData {
  const summariesByDate = buildDailySummariesByDate(
    records,
    selectedMonth,
    selectedYear,
  );
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const startOffset = getMondayFirstOffset(selectedYear, selectedMonth);
  const cells: Array<CalendarDaySummary | null> = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toIsoDate(selectedYear, selectedMonth, day);
    const totals = summariesByDate.get(date) ?? {
      receivableCents: 0,
      payableCents: 0,
    };

    cells.push({
      date,
      day,
      receivableCents: totals.receivableCents,
      payableCents: totals.payableCents,
      isToday: date === todayIso,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return {
    weekdayLabels: WEEKDAY_LABELS,
    weeks,
  };
}
