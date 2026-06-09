import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { FinancialRecordHistoryResponse } from "@fluxor/contracts";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import type {
  AppendHistoryEventInput,
  FinancialRecordHistoryRepositoryPort,
} from "../../ports/financial-record-history-repository.port.js";
import { getPool } from "./connection.js";
import {
  mapHistoryEventRow,
  type HistoryEventRow,
} from "./history-event-row.mapper.js";

export class MariadbFinancialRecordHistoryRepository
  implements FinancialRecordHistoryRepositoryPort
{
  async appendEvent(
    data: AppendHistoryEventInput,
  ): Promise<FinancialRecordHistoryResponse> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const id = await this.insertEvent(connection, data);
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT id, recordId, eventType, description, metadata, createdAt, createdBy
         FROM financial_record_history_event
         WHERE id = ?
         LIMIT 1`,
        [id],
      );

      return mapHistoryEventRow(rows[0] as HistoryEventRow);
    } finally {
      connection.release();
    }
  }

  async appendEventOnConnection(
    connection: PoolConnection,
    data: AppendHistoryEventInput,
    createdAt?: string,
  ): Promise<string> {
    return this.insertEvent(connection, data, createdAt);
  }

  async listByRecord(recordId: string) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, recordId, eventType, description, metadata, createdAt, createdBy
       FROM financial_record_history_event
       WHERE recordId = ?
       ORDER BY createdAt ASC`,
      [recordId],
    );

    return (rows as HistoryEventRow[]).map(mapHistoryEventRow);
  }

  private async insertEvent(
    connection: PoolConnection,
    data: AppendHistoryEventInput,
    createdAt: string = nowMysql(),
  ): Promise<string> {
    const id = generateId();

    await connection.execute<ResultSetHeader>(
      `INSERT INTO financial_record_history_event (
        id, recordId, eventType, description, metadata, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.recordId,
        data.eventType,
        data.description,
        data.metadata ?? null,
        createdAt,
        data.createdBy ?? null,
      ],
    );

    return id;
  }
}
