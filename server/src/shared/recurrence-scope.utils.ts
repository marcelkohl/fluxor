import type {
  FinancialRecordResponse,
  RecurrenceScope,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";

export function resolveRecurrenceScope(
  scope: RecurrenceScope | undefined,
): RecurrenceScope {
  return scope ?? "this_only";
}

export function isRecurringRecord(record: FinancialRecordResponse): boolean {
  return (
    record.recurrenceGroupId != null && record.recurrenceIndex != null
  );
}

export function buildBatchUpdateData(
  data: UpdateFinancialRecordRequest,
): UpdateFinancialRecordRequest {
  const batch: UpdateFinancialRecordRequest = {};

  if (data.description !== undefined) {
    batch.description = data.description;
  }
  if (data.categoryId !== undefined) {
    batch.categoryId = data.categoryId;
  }
  if (data.payeeId !== undefined) {
    batch.payeeId = data.payeeId;
  }
  if (data.walletId !== undefined) {
    batch.walletId = data.walletId;
  }
  if (data.expectedAmount !== undefined) {
    batch.expectedAmount = data.expectedAmount;
  }
  if (data.recordNote !== undefined) {
    batch.recordNote = data.recordNote;
  }

  return batch;
}

export function hasUpdateFields(
  data: UpdateFinancialRecordRequest,
): boolean {
  return Object.keys(data).length > 0;
}
