import type { FinancialRecord } from "@/features/home/types";

export function canQuickSettleRecord(record: FinancialRecord): boolean {
  return (
    record.status !== "completed" &&
    record.status !== "canceled" &&
    !record.isTransfer
  );
}
