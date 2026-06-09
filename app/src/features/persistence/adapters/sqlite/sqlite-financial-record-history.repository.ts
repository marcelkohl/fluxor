import type { SqlDatabase } from "@/features/database";
import { generateId, nowIso } from "@/features/database/utils";
import type { FinancialRecordHistoryRepositoryPort } from "@/features/persistence/ports";

import type {
  AppendHistoryEventData,
  FinancialRecordHistoryEvent,
} from "@/features/financial-records/domain";

interface HistoryEventRow {
  id: string;
  recordId: string;
  eventType: string;
  description: string;
  metadata: string | null;
  createdAt: string;
  createdBy: string | null;
}

function mapHistoryEventRow(row: HistoryEventRow): FinancialRecordHistoryEvent {
  return {
    id: row.id,
    recordId: row.recordId,
    eventType: row.eventType as FinancialRecordHistoryEvent["eventType"],
    description: row.description,
    metadata: row.metadata,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class SqliteFinancialRecordHistoryRepository implements FinancialRecordHistoryRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async appendEvent(
    data: AppendHistoryEventData,
  ): Promise<FinancialRecordHistoryEvent> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO financial_record_history_event (
        id, recordId, eventType, description, metadata, createdAt, createdBy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.recordId,
        data.eventType,
        data.description,
        data.metadata ?? null,
        now,
        data.createdBy ?? null,
      ],
    );

    const rows = await this.db.select<HistoryEventRow[]>(
      "SELECT * FROM financial_record_history_event WHERE id = $1 LIMIT 1",
      [id],
    );
    return mapHistoryEventRow(rows[0]!);
  }

  async listByRecord(recordId: string): Promise<FinancialRecordHistoryEvent[]> {
    const rows = await this.db.select<HistoryEventRow[]>(
      `SELECT * FROM financial_record_history_event
       WHERE recordId = $1
       ORDER BY createdAt ASC`,
      [recordId],
    );
    return rows.map(mapHistoryEventRow);
  }
}
