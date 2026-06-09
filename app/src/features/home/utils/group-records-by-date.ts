import type { FinancialRecord, RecordDayGroup } from "@/features/home/types";
import { calculateDailyTotals } from "./calculate-daily-total";

export function groupRecordsByDate(
  records: FinancialRecord[],
): RecordDayGroup[] {
  const groups = new Map<string, FinancialRecord[]>();

  for (const record of records) {
    const existing = groups.get(record.date) ?? [];
    existing.push(record);
    groups.set(record.date, existing);
  }

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, dayRecords]) => {
      const { totalReceivable, totalPayable } =
        calculateDailyTotals(dayRecords);

      return {
        date,
        records: dayRecords.sort((a, b) => a.title.localeCompare(b.title)),
        totalReceivable,
        totalPayable,
      };
    });
}
