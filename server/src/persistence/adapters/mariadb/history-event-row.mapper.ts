import type { FinancialRecordHistoryResponse } from "@fluxor/contracts";
import { toIsoDateTime } from "../../../shared/datetime.js";

export interface HistoryEventRow {
  id: string;
  recordId: string;
  eventType: string;
  description: string;
  metadata: string | null;
  createdAt: Date | string;
  createdBy: string | null;
}

export function mapHistoryEventRow(
  row: HistoryEventRow,
): FinancialRecordHistoryResponse {
  return {
    id: row.id,
    recordId: row.recordId,
    eventType: row.eventType as FinancialRecordHistoryResponse["eventType"],
    description: row.description,
    metadata: row.metadata,
    createdAt: toIsoDateTime(row.createdAt),
    createdBy: row.createdBy,
  };
}
