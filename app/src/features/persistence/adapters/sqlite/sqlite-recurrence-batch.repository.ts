import type { SqlDatabase } from "@/features/database";
import { generateId, nowIso } from "@/features/database/utils";
import type { RecurrenceBatchRepositoryPort } from "@/features/persistence/ports";

import type { CreateRecurrenceBatchData, RecurrenceBatch } from "@/features/financial-records/domain";

interface RecurrenceBatchRow {
  id: string;
  ruleDescription: string;
  startDate: string;
  endDate: string | null;
  occurrenceCount: number;
  createdAt: string;
}

function mapRecurrenceBatchRow(row: RecurrenceBatchRow): RecurrenceBatch {
  return {
    id: row.id,
    ruleDescription: row.ruleDescription,
    startDate: row.startDate,
    endDate: row.endDate,
    occurrenceCount: row.occurrenceCount,
    createdAt: row.createdAt,
  };
}

export class SqliteRecurrenceBatchRepository implements RecurrenceBatchRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateRecurrenceBatchData): Promise<RecurrenceBatch> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO recurrence_batch (
        id, ruleDescription, startDate, endDate, occurrenceCount, createdAt
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        data.ruleDescription,
        data.startDate,
        data.endDate ?? null,
        data.occurrenceCount,
        now,
      ],
    );

    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<RecurrenceBatch | null> {
    const rows = await this.db.select<RecurrenceBatchRow[]>(
      "SELECT * FROM recurrence_batch WHERE id = $1 LIMIT 1",
      [id],
    );
    const row = rows[0];
    return row ? mapRecurrenceBatchRow(row) : null;
  }
}
