import type { SqlDatabase } from "@/features/database";
import { generateId, nowIso } from "@/features/database/utils";
import type { TransferLinkRepositoryPort } from "@/features/persistence/ports";

import type { CreateTransferLinkData, TransferLink } from "@/features/financial-records/domain";

interface TransferLinkRow {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  createdAt: string;
}

function mapTransferLinkRow(row: TransferLinkRow): TransferLink {
  return {
    id: row.id,
    sourceRecordId: row.sourceRecordId,
    targetRecordId: row.targetRecordId,
    createdAt: row.createdAt,
  };
}

export class SqliteTransferLinkRepository implements TransferLinkRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateTransferLinkData): Promise<TransferLink> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO transfer_link (id, sourceRecordId, targetRecordId, createdAt)
       VALUES ($1, $2, $3, $4)`,
      [id, data.sourceRecordId, data.targetRecordId, now],
    );

    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<TransferLink | null> {
    const rows = await this.db.select<TransferLinkRow[]>(
      "SELECT * FROM transfer_link WHERE id = $1 LIMIT 1",
      [id],
    );
    const row = rows[0];
    return row ? mapTransferLinkRow(row) : null;
  }
}
