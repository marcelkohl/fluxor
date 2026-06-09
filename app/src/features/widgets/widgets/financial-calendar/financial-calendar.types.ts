export type CalendarDaySummary = {
  date: string;
  day: number;
  receivableCents: number;
  payableCents: number;
  isToday: boolean;
};

export type CalendarWeek = Array<CalendarDaySummary | null>;

export interface FinancialCalendarData {
  weekdayLabels: readonly string[];
  weeks: CalendarWeek[];
}
