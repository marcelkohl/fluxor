import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type {
  CreateFinancialRecordRequest,
  FinancialRecordResponse,
  ListFinancialRecordsRequest,
  ListFinancialRecordsResponse,
  RegisterPaymentRequest,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";
import { formatPaymentHistoryDescription } from "../../../financial-records/format-payment-history-description.js";
import { FinancialRecordNotFoundError } from "../../../financial-records/errors/financial-record-not-found.error.js";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import type { FinancialRecordRepositoryPort } from "../../ports/financial-record-repository.port.js";
import type { MariadbFinancialRecordHistoryRepository } from "./mariadb-financial-record-history.repository.js";
import { getPool } from "./connection.js";
import {
  ACTIVE_FINANCIAL_RECORD_WHERE,
  FINANCIAL_RECORD_SELECT_COLUMNS,
  mapFinancialRecordRow,
  type FinancialRecordRow,
} from "./financial-record-row.mapper.js";

function buildListConditions(
  request?: ListFinancialRecordsRequest,
): { where: string; params: unknown[] } {
  const conditions = [ACTIVE_FINANCIAL_RECORD_WHERE];
  const params: unknown[] = [];

  if (request?.walletId) {
    conditions.push("walletId = ?");
    params.push(request.walletId);
  }

  if (request?.categoryId) {
    conditions.push("categoryId = ?");
    params.push(request.categoryId);
  }

  if (request?.payeeId) {
    conditions.push("payeeId = ?");
    params.push(request.payeeId);
  }

  if (request?.type) {
    conditions.push("type = ?");
    params.push(request.type);
  }

  if (request?.status) {
    conditions.push("storedStatus = ?");
    params.push(request.status);
  }

  if (request?.startDate) {
    conditions.push("dueDate >= ?");
    params.push(request.startDate);
  }

  if (request?.endDate) {
    conditions.push("dueDate <= ?");
    params.push(request.endDate);
  }

  return { where: conditions.join(" AND "), params };
}

export class MariadbFinancialRecordRepository
  implements FinancialRecordRepositoryPort
{
  constructor(
    private readonly history: MariadbFinancialRecordHistoryRepository,
  ) {}

  async create(
    data: CreateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse> {
    const pool = getPool();
    const id = generateId();
    const now = nowMysql();
    const storedStatus = data.storedStatus ?? "pending";
    const alertEnabled = data.alertEnabled ?? false;

    await pool.execute<ResultSetHeader>(
      `INSERT INTO financial_record (
        id, walletId, type, description, payeeId, categoryId, dueDate,
        expectedAmount, effectiveDate, effectiveAmount, recordNote, paymentNote,
        storedStatus, recurrenceGroupId, recurrenceIndex, alertEnabled, alertOffset,
        transferGroupId, createdAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        data.walletId,
        data.type,
        data.description,
        data.payeeId ?? null,
        data.categoryId,
        data.dueDate,
        data.expectedAmount,
        data.effectiveDate ?? null,
        data.effectiveAmount ?? null,
        data.recordNote ?? null,
        data.paymentNote ?? null,
        storedStatus,
        data.recurrenceGroupId ?? null,
        data.recurrenceIndex ?? null,
        alertEnabled ? 1 : 0,
        data.alertOffset ?? null,
        data.transferGroupId ?? null,
        now,
        now,
      ],
    );

    return (await this.getById(id))!;
  }

  async update(
    id: string,
    data: UpdateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new FinancialRecordNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE financial_record SET
        description = ?,
        categoryId = ?,
        dueDate = ?,
        expectedAmount = ?,
        payeeId = ?,
        recordNote = ?,
        alertEnabled = ?,
        alertOffset = ?,
        transferGroupId = ?,
        updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL`,
      [
        data.description ?? current.description,
        data.categoryId ?? current.categoryId,
        data.dueDate ?? current.dueDate,
        data.expectedAmount ?? current.expectedAmount,
        data.payeeId !== undefined ? data.payeeId : current.payeeId,
        data.recordNote !== undefined ? data.recordNote : current.recordNote,
        (data.alertEnabled ?? current.alertEnabled) ? 1 : 0,
        data.alertOffset !== undefined ? data.alertOffset : current.alertOffset,
        data.transferGroupId !== undefined
          ? data.transferGroupId
          : current.transferGroupId,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async registerPayment(
    id: string,
    data: RegisterPaymentRequest,
  ): Promise<FinancialRecordResponse> {
    const pool = getPool();
    const connection = await pool.getConnection();
    const now = nowMysql();
    const paymentNote = data.paymentNote?.trim() ? data.paymentNote.trim() : null;

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
         FROM financial_record
         WHERE id = ? AND ${ACTIVE_FINANCIAL_RECORD_WHERE}
         LIMIT 1
         FOR UPDATE`,
        [id],
      );

      const current = rows[0] as FinancialRecordRow | undefined;
      if (!current) {
        throw new FinancialRecordNotFoundError(id);
      }

      await connection.execute<ResultSetHeader>(
        `UPDATE financial_record SET
          effectiveDate = ?,
          effectiveAmount = ?,
          paymentNote = ?,
          storedStatus = 'completed',
          updatedAt = ?
        WHERE id = ? AND deletedAt IS NULL`,
        [
          data.effectiveDate,
          data.effectiveAmount,
          paymentNote,
          now,
          id,
        ],
      );

      await this.history.appendEventOnConnection(
        connection,
        {
          recordId: id,
          eventType: "payment_registered",
          description: formatPaymentHistoryDescription(
            current.type as FinancialRecordResponse["type"],
            data.effectiveAmount,
            data.effectiveDate,
          ),
        },
        now,
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

  async revertPayment(id: string): Promise<FinancialRecordResponse> {
    const pool = getPool();
    const connection = await pool.getConnection();
    const now = nowMysql();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
         FROM financial_record
         WHERE id = ? AND ${ACTIVE_FINANCIAL_RECORD_WHERE}
         LIMIT 1
         FOR UPDATE`,
        [id],
      );

      if (!rows[0]) {
        throw new FinancialRecordNotFoundError(id);
      }

      await connection.execute<ResultSetHeader>(
        `UPDATE financial_record SET
          effectiveDate = NULL,
          effectiveAmount = NULL,
          paymentNote = NULL,
          storedStatus = 'pending',
          updatedAt = ?
        WHERE id = ? AND deletedAt IS NULL`,
        [now, id],
      );

      await this.history.appendEventOnConnection(
        connection,
        {
          recordId: id,
          eventType: "payment_reverted",
          description: "Efetivação revertida",
        },
        now,
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

  async list(
    request?: ListFinancialRecordsRequest,
  ): Promise<ListFinancialRecordsResponse> {
    const pool = getPool();
    const { where, params } = buildListConditions(request);
    const hasPagination =
      request?.page !== undefined || request?.pageSize !== undefined;

    if (!hasPagination) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
         FROM financial_record
         WHERE ${where}
         ORDER BY dueDate ASC, createdAt ASC`,
        params,
      );

      return (rows as FinancialRecordRow[]).map(mapFinancialRecordRow);
    }

    const page = Math.max(1, request?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, request?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM financial_record WHERE ${where}`,
      params,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
       FROM financial_record
       WHERE ${where}
       ORDER BY dueDate ASC, createdAt ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return {
      items: (rows as FinancialRecordRow[]).map(mapFinancialRecordRow),
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

  async getById(id: string): Promise<FinancialRecordResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
       FROM financial_record
       WHERE id = ? AND ${ACTIVE_FINANCIAL_RECORD_WHERE}
       LIMIT 1`,
      [id],
    );

    const row = rows[0] as FinancialRecordRow | undefined;
    return row ? mapFinancialRecordRow(row) : null;
  }

  async archive(id: string): Promise<FinancialRecordResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new FinancialRecordNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE financial_record SET deletedAt = ?, updatedAt = ?
       WHERE id = ? AND deletedAt IS NULL`,
      [now, now, id],
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
       FROM financial_record
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return mapFinancialRecordRow(rows[0] as FinancialRecordRow);
  }
}
