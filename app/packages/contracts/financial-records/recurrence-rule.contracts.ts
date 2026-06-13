import type { IsoDate } from "../common/dates";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceWeekdayPosition =
  | "first"
  | "second"
  | "third"
  | "fourth"
  | "last";

export type RecurrenceEnd =
  | { type: "count"; count: number }
  | { type: "until"; date: IsoDate };

/** 0 = domingo … 6 = sábado (Date.getDay()). */
export interface RecurrenceRule {
  interval: number;
  frequency: RecurrenceFrequency;
  weekDays?: number[];
  monthDay?: number;
  monthWeekdayPosition?: RecurrenceWeekdayPosition;
  monthWeekday?: number;
  end: RecurrenceEnd;
}
