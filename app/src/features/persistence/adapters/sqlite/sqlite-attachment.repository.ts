import type { SqlDatabase } from "@/features/database";
import { generateId, nowIso } from "@/features/database/utils";
import type { AttachmentRepositoryPort } from "@/features/persistence/ports";

import type { Attachment, CreateAttachmentData } from "@/features/financial-records/domain";

interface AttachmentRow {
  id: string;
  recordId: string;
  kind: string;
  label: string | null;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  createdAt: string;
  deletedAt: string | null;
}

function mapAttachmentRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    recordId: row.recordId,
    kind: row.kind as Attachment["kind"],
    label: row.label,
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    localPath: row.localPath,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  };
}

const ACTIVE_WHERE = "deletedAt IS NULL";

export class SqliteAttachmentRepository implements AttachmentRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateAttachmentData): Promise<Attachment> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO attachment (
        id, recordId, kind, label, filename, mimeType, size, localPath, createdAt, deletedAt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)`,
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

  async remove(id: string): Promise<Attachment> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Anexo não encontrado: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE attachment SET deletedAt = $1 WHERE id = $2 AND deletedAt IS NULL`,
      [now, id],
    );

    const rows = await this.db.select<AttachmentRow[]>(
      "SELECT * FROM attachment WHERE id = $1 LIMIT 1",
      [id],
    );
    return mapAttachmentRow(rows[0]!);
  }

  async getById(id: string): Promise<Attachment | null> {
    const rows = await this.db.select<AttachmentRow[]>(
      `SELECT * FROM attachment WHERE id = $1 AND ${ACTIVE_WHERE} LIMIT 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapAttachmentRow(row) : null;
  }

  async listByRecord(recordId: string): Promise<Attachment[]> {
    const rows = await this.db.select<AttachmentRow[]>(
      `SELECT * FROM attachment
       WHERE recordId = $1 AND ${ACTIVE_WHERE}
       ORDER BY createdAt ASC`,
      [recordId],
    );
    return rows.map(mapAttachmentRow);
  }
}
