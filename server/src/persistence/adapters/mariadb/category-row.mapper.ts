import type { CategoryResponse } from "@fluxor/contracts";
import { toIsoDateTime } from "../../../shared/datetime.js";

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  isArchived: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

const CATEGORY_COLUMNS =
  "id, name, icon, color, description, isArchived, createdAt, updatedAt, deletedAt";

export const CATEGORY_SELECT_COLUMNS = CATEGORY_COLUMNS;

export const ACTIVE_CATEGORY_WHERE = "deletedAt IS NULL AND isArchived = 0";

export function mapCategoryRow(row: CategoryRow): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    description: row.description,
    isArchived: row.isArchived === 1,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}
