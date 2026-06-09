import type { FinancialRecord } from "@/features/home/types";

export interface DailyTotals {
  totalReceivable: number;
  totalPayable: number;
}

export function calculateDailyTotals(
  records: FinancialRecord[],
): DailyTotals {
  return records.reduce<DailyTotals>(
    (totals, record) => {
      if (record.type === "receivable") {
        totals.totalReceivable += record.amount;
      } else {
        totals.totalPayable += record.amount;
      }
      return totals;
    },
    { totalReceivable: 0, totalPayable: 0 },
  );
}
