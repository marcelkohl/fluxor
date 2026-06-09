import type { SqlDatabase } from "@/features/database";
import {
  boolToInt,
  generateId,
  intToBool,
  nowIso,
} from "@/features/database/utils";
import type { FinancialRecordRepositoryPort } from "@/features/persistence/ports";

import type {
  CreateFinancialRecordData,
  FinancialRecord,
  ListFinancialRecordsFilter,
  RegisterPaymentData,
  UpdateFinancialRecordData,
} from "@/features/financial-records/domain";

interface FinancialRecordRow {
  id: string;
  walletId: string;
  type: string;
  description: string;
  payeeId: string | null;
  categoryId: string;
  dueDate: string;
  expectedAmount: number;
  effectiveDate: string | null;
  effectiveAmount: number | null;
  recordNote: string | null;
  paymentNote: string | null;
  storedStatus: string;
  recurrenceGroupId: string | null;
  recurrenceIndex: number | null;
  alertEnabled: number;
  alertOffset: number | null;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapFinancialRecordRow(row: FinancialRecordRow): FinancialRecord {
  return {
    id: row.id,
    walletId: row.walletId,
    type: row.type as FinancialRecord["type"],
    description: row.description,
    payeeId: row.payeeId,
    categoryId: row.categoryId,
    dueDate: row.dueDate,
    expectedAmount: row.expectedAmount,
    effectiveDate: row.effectiveDate,
    effectiveAmount: row.effectiveAmount,
    recordNote: row.recordNote,
    paymentNote: row.paymentNote,
    storedStatus: row.storedStatus as FinancialRecord["storedStatus"],
    recurrenceGroupId: row.recurrenceGroupId,
    recurrenceIndex: row.recurrenceIndex,
    alertEnabled: intToBool(row.alertEnabled),
    alertOffset: row.alertOffset,
    transferGroupId: row.transferGroupId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

const ACTIVE_WHERE = "deletedAt IS NULL";

export class SqliteFinancialRecordRepository implements FinancialRecordRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateFinancialRecordData): Promise<FinancialRecord> {
    const id = generateId();
    const now = nowIso();
    const storedStatus = data.storedStatus ?? "pending";
    const alertEnabled = data.alertEnabled ?? false;

    await this.db.execute(
      `INSERT INTO financial_record (
        id, walletId, type, description, payeeId, categoryId, dueDate,
        expectedAmount, effectiveDate, effectiveAmount, recordNote, paymentNote,
        storedStatus, recurrenceGroupId, recurrenceIndex, alertEnabled, alertOffset,
        transferGroupId, createdAt, updatedAt, deletedAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, NULL
      )`,
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
        boolToInt(alertEnabled),
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
    data: UpdateFinancialRecordData,
  ): Promise<FinancialRecord> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Registro financeiro não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE financial_record SET
        description = $1,
        categoryId = $2,
        dueDate = $3,
        expectedAmount = $4,
        payeeId = $5,
        recordNote = $6,
        alertEnabled = $7,
        alertOffset = $8,
        transferGroupId = $9,
        updatedAt = $10
      WHERE id = $11 AND deletedAt IS NULL`,
      [
        data.description ?? current.description,
        data.categoryId ?? current.categoryId,
        data.dueDate ?? current.dueDate,
        data.expectedAmount ?? current.expectedAmount,
        data.payeeId !== undefined ? data.payeeId : current.payeeId,
        data.recordNote !== undefined ? data.recordNote : current.recordNote,
        boolToInt(data.alertEnabled ?? current.alertEnabled),
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
    data: RegisterPaymentData,
  ): Promise<FinancialRecord> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Registro financeiro não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE financial_record SET
        effectiveDate = $1,
        effectiveAmount = $2,
        paymentNote = $3,
        storedStatus = 'completed',
        updatedAt = $4
      WHERE id = $5 AND deletedAt IS NULL`,
      [data.effectiveDate, data.effectiveAmount, data.paymentNote, now, id],
    );

    return (await this.getById(id))!;
  }

  async revertPayment(id: string): Promise<FinancialRecord> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Registro financeiro não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE financial_record SET
        effectiveDate = NULL,
        effectiveAmount = NULL,
        paymentNote = NULL,
        storedStatus = 'pending',
        updatedAt = $1
      WHERE id = $2 AND deletedAt IS NULL`,
      [now, id],
    );

    return (await this.getById(id))!;
  }

  async archive(id: string): Promise<FinancialRecord> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Registro financeiro não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE financial_record SET deletedAt = $1, updatedAt = $2
       WHERE id = $3 AND deletedAt IS NULL`,
      [now, now, id],
    );

    const rows = await this.db.select<FinancialRecordRow[]>(
      "SELECT * FROM financial_record WHERE id = $1 LIMIT 1",
      [id],
    );
    return mapFinancialRecordRow(rows[0]!);
  }

  async getById(id: string): Promise<FinancialRecord | null> {
    const rows = await this.db.select<FinancialRecordRow[]>(
      `SELECT * FROM financial_record WHERE id = $1 AND ${ACTIVE_WHERE} LIMIT 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapFinancialRecordRow(row) : null;
  }

  async list(filter: ListFinancialRecordsFilter = {}): Promise<FinancialRecord[]> {
    const conditions = [ACTIVE_WHERE];
    const params: unknown[] = [];

    if (filter.walletId) {
      params.push(filter.walletId);
      conditions.push(`walletId = $${params.length}`);
    }

    const where = conditions.join(" AND ");
    const rows = await this.db.select<FinancialRecordRow[]>(
      `SELECT * FROM financial_record WHERE ${where} ORDER BY dueDate ASC, createdAt ASC`,
      params,
    );
    return rows.map(mapFinancialRecordRow);
  }
}
