import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type {
  CreatePayeeRequest,
  ListPayeesRequest,
  ListPayeesResponse,
  PayeeResponse,
  UpdatePayeeRequest,
} from "@fluxor/contracts";
import { PayeeNotFoundError } from "../../../payees/errors/payee-not-found.error.js";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import type { PayeeRepositoryPort } from "../../ports/payee-repository.port.js";
import { getPool } from "./connection.js";
import {
  ACTIVE_PAYEE_WHERE,
  mapPayeeRow,
  PAYEE_SELECT_COLUMNS,
  type PayeeRow,
} from "./payee-row.mapper.js";

export class MariadbPayeeRepository implements PayeeRepositoryPort {
  async create(data: CreatePayeeRequest): Promise<PayeeResponse> {
    const pool = getPool();
    const id = generateId();
    const now = nowMysql();

    await pool.execute<ResultSetHeader>(
      `INSERT INTO payee (
        id, name, notes, isArchived, createdAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, 0, ?, ?, NULL)`,
      [id, data.name, data.notes ?? null, now, now],
    );

    return (await this.getById(id))!;
  }

  async update(id: string, data: UpdatePayeeRequest): Promise<PayeeResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new PayeeNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE payee SET
        name = ?,
        notes = ?,
        updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.notes !== undefined ? data.notes : current.notes,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async list(request?: ListPayeesRequest): Promise<ListPayeesResponse> {
    const pool = getPool();
    const hasPagination =
      request?.page !== undefined || request?.pageSize !== undefined;

    if (!hasPagination) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${PAYEE_SELECT_COLUMNS}
         FROM payee
         WHERE ${ACTIVE_PAYEE_WHERE}
         ORDER BY name COLLATE utf8mb4_unicode_ci ASC`,
      );

      return (rows as PayeeRow[]).map(mapPayeeRow);
    }

    const page = Math.max(1, request?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, request?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM payee WHERE ${ACTIVE_PAYEE_WHERE}`,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PAYEE_SELECT_COLUMNS}
       FROM payee
       WHERE ${ACTIVE_PAYEE_WHERE}
       ORDER BY name COLLATE utf8mb4_unicode_ci ASC
       LIMIT ? OFFSET ?`,
      [pageSize, offset],
    );

    return {
      items: (rows as PayeeRow[]).map(mapPayeeRow),
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

  async getById(id: string): Promise<PayeeResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PAYEE_SELECT_COLUMNS}
       FROM payee
       WHERE id = ? AND deletedAt IS NULL
       LIMIT 1`,
      [id],
    );

    const row = rows[0] as PayeeRow | undefined;
    return row ? mapPayeeRow(row) : null;
  }

  async archive(id: string): Promise<PayeeResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new PayeeNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE payee SET isArchived = 1, updatedAt = ?
       WHERE id = ? AND deletedAt IS NULL AND isArchived = 0`,
      [now, id],
    );

    return (await this.getById(id))!;
  }
}
