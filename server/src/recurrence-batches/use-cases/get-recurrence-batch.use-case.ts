import type { RowDataPacket } from "mysql2/promise";
import type { RecurrenceBatchResponse } from "@fluxor/contracts";
import { RecurrenceBatchNotFoundError } from "../errors/recurrence-batch-not-found.error.js";
import { getPool } from "../../persistence/adapters/mariadb/connection.js";

interface RecurrenceBatchRow {
  id: string;
  ruleDescription: string;
  startDate: string;
  endDate: string | null;
  occurrenceCount: number;
  createdAt: string;
}

function mapRow(row: RecurrenceBatchRow): RecurrenceBatchResponse {
  return {
    id: row.id,
    ruleDescription: row.ruleDescription,
    startDate: row.startDate,
    endDate: row.endDate,
    occurrenceCount: row.occurrenceCount,
    createdAt: row.createdAt,
  };
}

export class GetRecurrenceBatchUseCase {
  async execute(batchId: string): Promise<RecurrenceBatchResponse> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, ruleDescription, startDate, endDate, occurrenceCount, createdAt
       FROM recurrence_batch
       WHERE id = ?
       LIMIT 1`,
      [batchId],
    );

    const row = rows[0] as RecurrenceBatchRow | undefined;
    if (!row) {
      throw new RecurrenceBatchNotFoundError(batchId);
    }

    return mapRow(row);
  }
}
