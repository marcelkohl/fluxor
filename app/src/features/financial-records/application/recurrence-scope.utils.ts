import type { RecurrenceScope } from "@fluxor/contracts";

import type {
  FinancialRecord,
  UpdateFinancialRecordData,
} from "../domain";

export interface RecurrenceUpdateInput {
  walletId?: string;
  type?: FinancialRecord["type"];
  description?: string;
  categoryId?: string;
  dueDate?: string;
  expectedAmount?: number;
  payeeId?: string | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
}

export function resolveRecurrenceScope(
  scope: RecurrenceScope | undefined,
): RecurrenceScope {
  return scope ?? "this_only";
}

export function isRecurringRecord(record: FinancialRecord): boolean {
  return (
    record.recurrenceGroupId != null && record.recurrenceIndex != null
  );
}

export function buildFullUpdateData(
  input: RecurrenceUpdateInput,
): UpdateFinancialRecordData {
  const data: UpdateFinancialRecordData = {};

  if (input.walletId !== undefined) {
    data.walletId = input.walletId;
  }
  if (input.type !== undefined) {
    data.type = input.type;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.categoryId !== undefined) {
    data.categoryId = input.categoryId;
  }
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate;
  }
  if (input.expectedAmount !== undefined) {
    data.expectedAmount = input.expectedAmount;
  }
  if (input.payeeId !== undefined) {
    data.payeeId = input.payeeId;
  }
  if (input.recordNote !== undefined) {
    data.recordNote = input.recordNote;
  }
  if (input.alertEnabled !== undefined) {
    data.alertEnabled = input.alertEnabled;
  }
  if (input.alertOffset !== undefined) {
    data.alertOffset = input.alertOffset;
  }

  return data;
}

/** Campos comuns propagáveis em lote para ocorrências futuras. */
export function buildBatchUpdateData(
  input: RecurrenceUpdateInput,
): UpdateFinancialRecordData {
  const data: UpdateFinancialRecordData = {};

  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.categoryId !== undefined) {
    data.categoryId = input.categoryId;
  }
  if (input.payeeId !== undefined) {
    data.payeeId = input.payeeId;
  }
  if (input.walletId !== undefined) {
    data.walletId = input.walletId;
  }
  if (input.expectedAmount !== undefined) {
    data.expectedAmount = input.expectedAmount;
  }
  if (input.recordNote !== undefined) {
    data.recordNote = input.recordNote;
  }

  return data;
}

export function hasUpdateFields(data: UpdateFinancialRecordData): boolean {
  return Object.keys(data).length > 0;
}
