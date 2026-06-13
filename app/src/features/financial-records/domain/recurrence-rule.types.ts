export type {
  RecurrenceEnd,
  RecurrenceFrequency,
  RecurrenceRule,
  RecurrenceWeekdayPosition,
} from "@fluxor/contracts";

export const MIN_RECURRENCE_INTERVAL = 1;
export const MAX_RECURRENCE_INTERVAL = 60;

export const MIN_RECURRENCE_OCCURRENCES = 2;
export const MAX_RECURRENCE_OCCURRENCES = 60;

/** 0 = domingo … 6 = sábado */
export const RECURRENCE_WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0] as const;

export const RECURRENCE_WEEKDAY_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export const RECURRENCE_FREQUENCY_UNIT_LABELS: Record<
  import("@fluxor/contracts").RecurrenceFrequency,
  string
> = {
  daily: "dias",
  weekly: "semanas",
  monthly: "meses",
  yearly: "anos",
};

export const RECURRENCE_FREQUENCY_OPTIONS = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;
