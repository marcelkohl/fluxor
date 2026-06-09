import type { FinancialRecord as DomainRecord } from "@/features/financial-records/domain";
import type {
  FinancialRecord as HomeRecord,
  FinancialRecordStatus,
} from "@/features/home/types";

export function deriveDisplayStatus(
  record: DomainRecord,
  referenceDate: string,
): FinancialRecordStatus {
  if (record.storedStatus === "completed") {
    return "completed";
  }

  if (record.dueDate < referenceDate) {
    return "overdue";
  }

  return "pending";
}

export function domainRecordToHomeRecord(
  record: DomainRecord,
  referenceDate: string,
): HomeRecord {
  const amountCents =
    record.storedStatus === "completed" && record.effectiveAmount != null
      ? record.effectiveAmount
      : record.expectedAmount;

  return {
    id: record.id,
    title: record.description,
    accountId: record.walletId,
    categoryId: record.categoryId,
    payeeId: record.payeeId ?? undefined,
    type: record.type,
    status: deriveDisplayStatus(record, referenceDate),
    amount: amountCents / 100,
    date: record.dueDate,
    expectedAmountCents: record.expectedAmount,
    effectiveAmountCents: record.effectiveAmount,
    recordNote: record.recordNote,
    paymentNote: record.paymentNote,
    isRecurring: record.recurrenceGroupId != null,
    isTransfer: record.transferGroupId != null,
  };
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
