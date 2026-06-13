import type { FinancialRecord } from "@/features/home/types";

import { isToday } from "./format";

export function getRecordStatusStripClass(
  record: FinancialRecord,
  referenceDate: string,
): string {
  if (record.status === "completed") {
    return "bg-income";
  }

  if (record.status === "canceled") {
    return "";
  }

  if (record.date < referenceDate) {
    return "bg-expense";
  }

  if (isToday(record.date, referenceDate)) {
    return "bg-warning";
  }

  return "";
}
