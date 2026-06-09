import type { SqlDatabase } from "@/features/database";
import {
  generateId,
  intToBool,
  nowIso,
} from "@/features/database/utils";
import type { PayeeRepositoryPort } from "@/features/persistence/ports";

import type { CreatePayeeData, Payee, UpdatePayeeData } from "@/features/payees/domain";

interface PayeeRow {
  id: string;
  name: string;
  notes: string | null;
  isArchived: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapPayeeRow(row: PayeeRow): Payee {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    isArchived: intToBool(row.isArchived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

const ACTIVE_WHERE = "deletedAt IS NULL AND isArchived = 0";

export class SqlitePayeeRepository implements PayeeRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreatePayeeData): Promise<Payee> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO payee (
        id, name, notes, isArchived, createdAt, updatedAt, deletedAt
      ) VALUES ($1, $2, $3, 0, $4, $5, NULL)`,
      [id, data.name, data.notes ?? null, now, now],
    );

    return (await this.getById(id))!;
  }

  async update(id: string, data: UpdatePayeeData): Promise<Payee> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Payee não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE payee SET
        name = $1,
        notes = $2,
        updatedAt = $3
      WHERE id = $4 AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.notes !== undefined ? data.notes : current.notes,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async listActive(): Promise<Payee[]> {
    const rows = await this.db.select<PayeeRow[]>(
      `SELECT * FROM payee WHERE ${ACTIVE_WHERE} ORDER BY name COLLATE NOCASE ASC`,
    );
    return rows.map(mapPayeeRow);
  }

  async getById(id: string): Promise<Payee | null> {
    const rows = await this.db.select<PayeeRow[]>(
      "SELECT * FROM payee WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    return row ? mapPayeeRow(row) : null;
  }

  async archive(id: string): Promise<Payee> {
    const now = nowIso();

    await this.db.execute(
      `UPDATE payee SET isArchived = 1, updatedAt = $1
       WHERE id = $2 AND deletedAt IS NULL AND isArchived = 0`,
      [now, id],
    );

    const rows = await this.db.select<PayeeRow[]>(
      "SELECT * FROM payee WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    if (!rows[0]) {
      throw new Error(`Payee não encontrado: ${id}`);
    }
    return mapPayeeRow(rows[0]);
  }
}
