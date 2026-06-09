import type { FinancialRecord } from "@/features/home/types";
import type { HomeFiltersState } from "@/features/home/state/home-state.types";

export function applyHomeFilters(
  records: FinancialRecord[],
  filters: HomeFiltersState,
): FinancialRecord[] {
  return records.filter((record) => matchesAllFilters(record, filters));
}

function matchesAllFilters(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  return (
    matchesDateRange(record, filters) &&
    matchesType(record, filters) &&
    matchesStatus(record, filters) &&
    matchesCategory(record, filters) &&
    matchesPayee(record, filters) &&
    matchesValueRange(record, filters) &&
    matchesDocumentState(record, filters) &&
    matchesReceiptState(record, filters) &&
    matchesRecurringState(record, filters)
  );
}

function matchesDateRange(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.startDate && record.date < filters.startDate) {
    return false;
  }

  if (filters.endDate && record.date > filters.endDate) {
    return false;
  }

  return true;
}

function matchesType(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.type === "all") {
    return true;
  }

  return record.type === filters.type;
}

function matchesStatus(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.status === "all") {
    return true;
  }

  return record.status === filters.status;
}

function matchesCategory(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (!filters.categoryId) {
    return true;
  }

  return record.categoryId === filters.categoryId;
}

function matchesPayee(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (!filters.payeeId) {
    return true;
  }

  return record.payeeId === filters.payeeId;
}

function matchesValueRange(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  const amountCents = Math.round(record.amount * 100);

  if (filters.minValue !== null && amountCents < filters.minValue) {
    return false;
  }

  if (filters.maxValue !== null && amountCents > filters.maxValue) {
    return false;
  }

  return true;
}

function matchesDocumentState(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.documentState === "all") {
    return true;
  }

  const hasDocument = record.hasDocument ?? false;

  if (filters.documentState === "withDocument") {
    return hasDocument;
  }

  return !hasDocument;
}

function matchesReceiptState(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.receiptState === "all") {
    return true;
  }

  const hasReceipt = record.hasReceipt ?? false;

  if (filters.receiptState === "withReceipt") {
    return hasReceipt;
  }

  return !hasReceipt;
}

function matchesRecurringState(
  record: FinancialRecord,
  filters: HomeFiltersState,
): boolean {
  if (filters.recurringState === "all") {
    return true;
  }

  const isRecurring = record.isRecurring ?? false;

  if (filters.recurringState === "recurring") {
    return isRecurring;
  }

  return !isRecurring;
}
