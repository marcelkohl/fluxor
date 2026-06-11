import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type {
  AttachmentResponse,
  CreateAttachmentRequest,
  ListAttachmentsResponse,
} from "@fluxor/contracts";
import { AttachmentNotFoundError } from "../../../attachments/errors/attachment-not-found.error.js";
import { nowMysql } from "../../../shared/datetime.js";
import { generateId } from "../../../shared/id.js";
import type { AttachmentRepositoryPort } from "../../ports/attachment-repository.port.js";
import { getPool } from "./connection.js";
import {
  ACTIVE_ATTACHMENT_WHERE,
  ATTACHMENT_SELECT_COLUMNS,
  mapAttachmentRow,
  type AttachmentRow,
} from "./attachment-row.mapper.js";

export class MariadbAttachmentRepository implements AttachmentRepositoryPort {
  async create(data: CreateAttachmentRequest): Promise<AttachmentResponse> {
    const pool = getPool();
    const id = generateId();
    const now = nowMysql();

    await pool.execute<ResultSetHeader>(
      `INSERT INTO attachment (
        id, recordId, kind, label, filename, mimeType, size, localPath, createdAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        data.recordId,
        data.kind,
        data.label ?? null,
        data.filename,
        data.mimeType,
        data.size,
        data.localPath,
        now,
      ],
    );

    return (await this.getById(id))!;
  }

  async remove(id: string): Promise<AttachmentResponse> {
    const current = await this.getById(id);
    if (!current) {
      throw new AttachmentNotFoundError(id);
    }

    const now = nowMysql();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `UPDATE attachment SET deletedAt = ? WHERE id = ? AND ${ACTIVE_ATTACHMENT_WHERE}`,
      [now, id],
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ATTACHMENT_SELECT_COLUMNS}
       FROM attachment
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return mapAttachmentRow(rows[0] as AttachmentRow);
  }

  async getById(id: string): Promise<AttachmentResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ATTACHMENT_SELECT_COLUMNS}
       FROM attachment
       WHERE id = ? AND ${ACTIVE_ATTACHMENT_WHERE}
       LIMIT 1`,
      [id],
    );

    const row = rows[0] as AttachmentRow | undefined;
    return row ? mapAttachmentRow(row) : null;
  }

  async listByRecord(recordId: string): Promise<ListAttachmentsResponse> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ATTACHMENT_SELECT_COLUMNS}
       FROM attachment
       WHERE recordId = ? AND ${ACTIVE_ATTACHMENT_WHERE}
       ORDER BY createdAt ASC`,
      [recordId],
    );

    return (rows as AttachmentRow[]).map(mapAttachmentRow);
  }
}
