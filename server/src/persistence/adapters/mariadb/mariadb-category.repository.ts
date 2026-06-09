import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type {
  CategoryResponse,
  CreateCategoryRequest,
  ListCategoriesRequest,
  ListCategoriesResponse,
  UpdateCategoryRequest,
} from "@fluxor/contracts";
import { CategoryNotFoundError } from "../../../categories/errors/category-not-found.error.js";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import type { CategoryRepositoryPort } from "../../ports/category-repository.port.js";
import { getPool } from "./connection.js";
import {
  ACTIVE_CATEGORY_WHERE,
  CATEGORY_SELECT_COLUMNS,
  mapCategoryRow,
  type CategoryRow,
} from "./category-row.mapper.js";

export class MariadbCategoryRepository implements CategoryRepositoryPort {
  async create(data: CreateCategoryRequest): Promise<CategoryResponse> {
    const pool = getPool();
    const id = generateId();
    const now = nowMysql();

    await pool.execute<ResultSetHeader>(
      `INSERT INTO category (
        id, name, icon, color, description, isArchived, createdAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
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

  async update(
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new CategoryNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE category SET
        name = ?,
        icon = ?,
        color = ?,
        description = ?,
        updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.icon ?? current.icon,
        data.color ?? current.color,
        data.description !== undefined
          ? data.description
          : current.description,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async list(
    request?: ListCategoriesRequest,
  ): Promise<ListCategoriesResponse> {
    const pool = getPool();
    const hasPagination =
      request?.page !== undefined || request?.pageSize !== undefined;

    if (!hasPagination) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${CATEGORY_SELECT_COLUMNS}
         FROM category
         WHERE ${ACTIVE_CATEGORY_WHERE}
         ORDER BY name COLLATE utf8mb4_unicode_ci ASC`,
      );

      return (rows as CategoryRow[]).map(mapCategoryRow);
    }

    const page = Math.max(1, request?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, request?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM category WHERE ${ACTIVE_CATEGORY_WHERE}`,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${CATEGORY_SELECT_COLUMNS}
       FROM category
       WHERE ${ACTIVE_CATEGORY_WHERE}
       ORDER BY name COLLATE utf8mb4_unicode_ci ASC
       LIMIT ? OFFSET ?`,
      [pageSize, offset],
    );

    return {
      items: (rows as CategoryRow[]).map(mapCategoryRow),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getById(id: string): Promise<CategoryResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${CATEGORY_SELECT_COLUMNS}
       FROM category
       WHERE id = ? AND deletedAt IS NULL
       LIMIT 1`,
      [id],
    );

    const row = rows[0] as CategoryRow | undefined;
    return row ? mapCategoryRow(row) : null;
  }

  async archive(id: string): Promise<CategoryResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new CategoryNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE category SET isArchived = 1, updatedAt = ?
       WHERE id = ? AND deletedAt IS NULL AND isArchived = 0`,
      [now, id],
    );

    return (await this.getById(id))!;
  }
}
