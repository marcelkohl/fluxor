import type { WalletResponse } from "@fluxor/contracts";
import { toIsoDateTime } from "../../../shared/datetime.js";

export interface WalletRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string | null;
  isDefault: number;
  isArchived: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

const WALLET_COLUMNS =
  "id, name, icon, color, notes, isDefault, isArchived, createdAt, updatedAt, deletedAt";

export const WALLET_SELECT_COLUMNS = WALLET_COLUMNS;

export const ACTIVE_WALLET_WHERE = "deletedAt IS NULL AND isArchived = 0";

export function mapWalletRow(row: WalletRow): WalletResponse {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    notes: row.notes,
    isDefault: row.isDefault === 1,
    isArchived: row.isArchived === 1,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}
