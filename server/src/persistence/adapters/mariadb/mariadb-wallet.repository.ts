import type {
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";
import type {
  CreateWalletRequest,
  ListWalletsRequest,
  ListWalletsResponse,
  UpdateWalletRequest,
  WalletResponse,
} from "@fluxor/contracts";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import { WalletNotFoundError } from "../../../wallets/errors/wallet-not-found.error.js";
import { WalletValidationError } from "../../../wallets/errors/wallet-validation.error.js";
import type { WalletRepositoryPort } from "../../ports/wallet-repository.port.js";
import { getPool } from "./connection.js";
import {
  ACTIVE_WALLET_WHERE,
  mapWalletRow,
  WALLET_SELECT_COLUMNS,
  type WalletRow,
} from "./wallet-row.mapper.js";

export class MariadbWalletRepository implements WalletRepositoryPort {
  async create(data: CreateWalletRequest): Promise<WalletResponse> {
    const pool = getPool();
    const id = generateId();
    const now = nowMysql();
    const isDefault = data.isDefault ?? false;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (isDefault) {
        await this.clearDefaultFlags(connection, now);
      }

      await connection.execute<ResultSetHeader>(
        `INSERT INTO wallet (
          id, name, icon, color, notes, isDefault, isArchived, createdAt, updatedAt, deletedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
        [
          id,
          data.name,
          data.icon,
          data.color,
          data.notes ?? null,
          isDefault ? 1 : 0,
          now,
          now,
        ],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return (await this.getById(id))!;
  }

  async update(id: string, data: UpdateWalletRequest): Promise<WalletResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new WalletNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE wallet SET
        name = ?,
        icon = ?,
        color = ?,
        notes = ?,
        updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.icon ?? current.icon,
        data.color ?? current.color,
        data.notes !== undefined ? data.notes : current.notes,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async list(request?: ListWalletsRequest): Promise<ListWalletsResponse> {
    const pool = getPool();
    const hasPagination =
      request?.page !== undefined || request?.pageSize !== undefined;

    if (!hasPagination) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${WALLET_SELECT_COLUMNS}
         FROM wallet
         WHERE ${ACTIVE_WALLET_WHERE}
         ORDER BY name COLLATE utf8mb4_unicode_ci ASC`,
      );

      return (rows as WalletRow[]).map(mapWalletRow);
    }

    const page = Math.max(1, request?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, request?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM wallet WHERE ${ACTIVE_WALLET_WHERE}`,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${WALLET_SELECT_COLUMNS}
       FROM wallet
       WHERE ${ACTIVE_WALLET_WHERE}
       ORDER BY name COLLATE utf8mb4_unicode_ci ASC
       LIMIT ? OFFSET ?`,
      [pageSize, offset],
    );

    return {
      items: (rows as WalletRow[]).map(mapWalletRow),
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

  async getById(id: string): Promise<WalletResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${WALLET_SELECT_COLUMNS}
       FROM wallet
       WHERE id = ? AND deletedAt IS NULL
       LIMIT 1`,
      [id],
    );

    const row = rows[0] as WalletRow | undefined;
    return row ? mapWalletRow(row) : null;
  }

  async archive(id: string): Promise<WalletResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new WalletNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (current.isDefault) {
        await connection.execute<ResultSetHeader>(
          "UPDATE wallet SET isDefault = 0, updatedAt = ? WHERE id = ?",
          [now, id],
        );
      }

      await connection.execute<ResultSetHeader>(
        `UPDATE wallet SET isArchived = 1, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL AND isArchived = 0`,
        [now, id],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return (await this.getById(id))!;
  }

  async setDefault(id: string): Promise<WalletResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new WalletNotFoundError(id);
    }

    if (current.isArchived) {
      throw new WalletValidationError(
        "wallet_archived_cannot_be_default",
        "Archived wallet cannot be default",
      );
    }

    const now = nowMysql();
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await this.clearDefaultFlags(connection, now);

      await connection.execute<ResultSetHeader>(
        `UPDATE wallet SET isDefault = 1, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL AND isArchived = 0`,
        [now, id],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return (await this.getById(id))!;
  }

  private async clearDefaultFlags(
    connection: PoolConnection,
    updatedAt: string,
  ): Promise<void> {
    await connection.execute<ResultSetHeader>(
      `UPDATE wallet SET isDefault = 0, updatedAt = ?
       WHERE isDefault = 1 AND deletedAt IS NULL`,
      [updatedAt],
    );
  }
}
