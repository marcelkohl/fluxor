import type { SqlDatabase } from "@/features/database";
import { generateId, nowIso } from "@/features/database/utils";
import type { PayeeDocumentRepositoryPort } from "@/features/persistence/ports";

import type {
  CreatePayeeDocumentData,
  PayeeDocument,
} from "@/features/payees/domain";

interface PayeeDocumentRow {
  id: string;
  payeeId: string;
  type: string;
  value: string;
  createdAt: string;
}

function mapRow(row: PayeeDocumentRow): PayeeDocument {
  return {
    id: row.id,
    payeeId: row.payeeId,
    type: row.type,
    value: row.value,
    createdAt: row.createdAt,
  };
}

export class SqlitePayeeDocumentRepository implements PayeeDocumentRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreatePayeeDocumentData): Promise<PayeeDocument> {
    const id = generateId();
    const now = nowIso();

    await this.db.execute(
      `INSERT INTO payee_document (id, payeeId, type, value, createdAt)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, data.payeeId, data.type, data.value, now],
    );

    const rows = await this.db.select<PayeeDocumentRow[]>(
      "SELECT * FROM payee_document WHERE id = $1 LIMIT 1",
      [id],
    );
    return mapRow(rows[0]!);
  }

  async listByPayee(payeeId: string): Promise<PayeeDocument[]> {
    const rows = await this.db.select<PayeeDocumentRow[]>(
      `SELECT * FROM payee_document WHERE payeeId = $1
       ORDER BY createdAt ASC`,
      [payeeId],
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<PayeeDocument | null> {
    const rows = await this.db.select<PayeeDocumentRow[]>(
      "SELECT * FROM payee_document WHERE id = $1 LIMIT 1",
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async remove(id: string): Promise<void> {
    await this.db.execute("DELETE FROM payee_document WHERE id = $1", [id]);
  }
}
