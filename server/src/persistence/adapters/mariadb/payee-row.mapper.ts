import type { PayeeResponse } from "@fluxor/contracts";
import { toIsoDateTime } from "../../../shared/datetime.js";

export interface PayeeRow {
  id: string;
  name: string;
  notes: string | null;
  isArchived: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

const PAYEE_COLUMNS =
  "id, name, notes, isArchived, createdAt, updatedAt, deletedAt";

export const PAYEE_SELECT_COLUMNS = PAYEE_COLUMNS;

export const ACTIVE_PAYEE_WHERE = "deletedAt IS NULL AND isArchived = 0";

export function mapPayeeRow(row: PayeeRow): PayeeResponse {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    isArchived: row.isArchived === 1,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}
