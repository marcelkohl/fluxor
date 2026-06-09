import type { SqlDatabase } from "@/features/database";
import {
  generateId,
  intToBool,
  nowIso,
} from "@/features/database/utils";
import type { CategoryRepositoryPort } from "@/features/persistence/ports";

import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/features/categories/domain";

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  isArchived: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    description: row.description,
    isArchived: intToBool(row.isArchived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

const ACTIVE_WHERE = "deletedAt IS NULL AND isArchived = 0";

export class SqliteCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateCategoryData): Promise<Category> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO category (
        id, name, icon, color, description, isArchived, createdAt, updatedAt, deletedAt
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NULL)`,
      [
        id,
        data.name,
        data.icon,
        data.color,
        data.description ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(id))!;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Category não encontrada: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE category SET
        name = $1,
        icon = $2,
        color = $3,
        description = $4,
        updatedAt = $5
      WHERE id = $6 AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.icon ?? current.icon,
        data.color ?? current.color,
        data.description !== undefined ? data.description : current.description,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async listActive(): Promise<Category[]> {
    const rows = await this.db.select<CategoryRow[]>(
      `SELECT * FROM category WHERE ${ACTIVE_WHERE} ORDER BY name COLLATE NOCASE ASC`,
    );
    return rows.map(mapCategoryRow);
  }

  async getById(id: string): Promise<Category | null> {
    const rows = await this.db.select<CategoryRow[]>(
      "SELECT * FROM category WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    return row ? mapCategoryRow(row) : null;
  }

  async archive(id: string): Promise<Category> {
    const now = nowIso();

    await this.db.execute(
      `UPDATE category SET isArchived = 1, updatedAt = $1
       WHERE id = $2 AND deletedAt IS NULL AND isArchived = 0`,
      [now, id],
    );

    const rows = await this.db.select<CategoryRow[]>(
      "SELECT * FROM category WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    if (!rows[0]) {
      throw new Error(`Category não encontrada: ${id}`);
    }
    return mapCategoryRow(rows[0]);
  }
}
