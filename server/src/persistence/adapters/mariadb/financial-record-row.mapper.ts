import type { FinancialRecordResponse } from "@fluxor/contracts";
import { toIsoDate, toIsoDateTime } from "../../../shared/datetime.js";

export interface FinancialRecordRow {
  id: string;
  walletId: string;
  type: string;
  description: string;
  payeeId: string | null;
  categoryId: string;
  dueDate: Date | string;
  expectedAmount: number;
  effectiveDate: Date | string | null;
  effectiveAmount: number | null;
  recordNote: string | null;
  paymentNote: string | null;
  storedStatus: string;
  recurrenceGroupId: string | null;
  recurrenceIndex: number | null;
  alertEnabled: number;
  alertOffset: number | null;
  transferGroupId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

const FINANCIAL_RECORD_COLUMNS = `
  id, walletId, type, description, payeeId, categoryId, dueDate,
  expectedAmount, effectiveDate, effectiveAmount, recordNote, paymentNote,
  storedStatus, recurrenceGroupId, recurrenceIndex, alertEnabled, alertOffset,
  transferGroupId, createdAt, updatedAt, deletedAt
`.trim();

export const FINANCIAL_RECORD_SELECT_COLUMNS = FINANCIAL_RECORD_COLUMNS;

export const ACTIVE_FINANCIAL_RECORD_WHERE = "deletedAt IS NULL";

export function mapFinancialRecordRow(
  row: FinancialRecordRow,
): FinancialRecordResponse {
  return {
    id: row.id,
    walletId: row.walletId,
    type: row.type as FinancialRecordResponse["type"],
    description: row.description,
    payeeId: row.payeeId,
    categoryId: row.categoryId,
    dueDate: toIsoDate(row.dueDate),
    expectedAmount: Number(row.expectedAmount),
    effectiveDate: row.effectiveDate ? toIsoDate(row.effectiveDate) : null,
    effectiveAmount:
      row.effectiveAmount !== null ? Number(row.effectiveAmount) : null,
    recordNote: row.recordNote,
    paymentNote: row.paymentNote,
    storedStatus: row.storedStatus as FinancialRecordResponse["storedStatus"],
    recurrenceGroupId: row.recurrenceGroupId,
    recurrenceIndex: row.recurrenceIndex,
    alertEnabled: row.alertEnabled === 1,
    alertOffset: row.alertOffset,
    transferGroupId: row.transferGroupId,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}
