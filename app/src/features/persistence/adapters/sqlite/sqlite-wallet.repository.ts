import type { SqlDatabase } from "@/features/database";
import {
  boolToInt,
  generateId,
  intToBool,
  nowIso,
} from "@/features/database/utils";
import type { WalletRepositoryPort } from "@/features/persistence/ports";

import type {
  CreateWalletData,
  UpdateWalletData,
  Wallet,
} from "@/features/wallets/domain";

interface WalletRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string | null;
  isDefault: number;
  isArchived: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapWalletRow(row: WalletRow): Wallet {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    notes: row.notes,
    isDefault: intToBool(row.isDefault),
    isArchived: intToBool(row.isArchived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

const ACTIVE_WHERE = "deletedAt IS NULL AND isArchived = 0";

export class SqliteWalletRepository implements WalletRepositoryPort {
  constructor(private readonly db: SqlDatabase) {}

  async create(data: CreateWalletData): Promise<Wallet> {
    const id = generateId();
    const now = nowIso();
    const isDefault = data.isDefault ?? false;

    if (isDefault) {
      await this.clearDefaultFlags(now);
    }

    await this.db.execute(
      `INSERT INTO wallet (
          id, name, icon, color, notes, isDefault, isArchived, createdAt, updatedAt, deletedAt
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, NULL)`,
      [
        id,
        data.name,
        data.icon,
        data.color,
        data.notes ?? null,
        boolToInt(isDefault),
        now,
        now,
      ],
    );

    return (await this.getById(id))!;
  }

  async update(id: string, data: UpdateWalletData): Promise<Wallet> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Wallet não encontrada: ${id}`);
    }

    const now = nowIso();

    await this.db.execute(
      `UPDATE wallet SET
        name = $1,
        icon = $2,
        color = $3,
        notes = $4,
        updatedAt = $5
      WHERE id = $6 AND deletedAt IS NULL`,
      [
        data.name ?? current.name,
        data.icon ?? current.icon,
        data.color ?? current.color,
        data.notes !== undefined ? data.notes : current.notes,
        now,
        id,
      ],
    );

    return (await this.getById(id))!;
  }

  async listActive(): Promise<Wallet[]> {
    const rows = await this.db.select<WalletRow[]>(
      `SELECT * FROM wallet WHERE ${ACTIVE_WHERE} ORDER BY name COLLATE NOCASE ASC`,
    );
    return rows.map(mapWalletRow);
  }

  async getById(id: string): Promise<Wallet | null> {
    const rows = await this.db.select<WalletRow[]>(
      "SELECT * FROM wallet WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    return row ? mapWalletRow(row) : null;
  }

  async archive(id: string): Promise<Wallet> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Wallet não encontrada: ${id}`);
    }

    const now = nowIso();

    await this.db.execute("BEGIN");
    try {
      if (current.isDefault) {
        await this.db.execute(
          "UPDATE wallet SET isDefault = 0, updatedAt = $1 WHERE id = $2",
          [now, id],
        );
      }

      await this.db.execute(
        `UPDATE wallet SET isArchived = 1, updatedAt = $1
         WHERE id = $2 AND deletedAt IS NULL AND isArchived = 0`,
        [now, id],
      );

      await this.db.execute("COMMIT");
    } catch (error) {
      await this.db.execute("ROLLBACK");
      throw error;
    }

    const archived = await this.db.select<WalletRow[]>(
      "SELECT * FROM wallet WHERE id = $1 AND deletedAt IS NULL LIMIT 1",
      [id],
    );
    return mapWalletRow(archived[0]!);
  }

  async setDefault(id: string): Promise<Wallet> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Wallet não encontrada: ${id}`);
    }
    if (current.isArchived) {
      throw new Error("Carteira arquivada não pode ser padrão");
    }

    const now = nowIso();

    await this.clearDefaultFlags(now);
    await this.db.execute(
      `UPDATE wallet SET isDefault = 1, updatedAt = $1
       WHERE id = $2 AND deletedAt IS NULL AND isArchived = 0`,
      [now, id],
    );

    return (await this.getById(id))!;
  }

  private async clearDefaultFlags(updatedAt: string): Promise<void> {
    await this.db.execute(
      `UPDATE wallet SET isDefault = 0, updatedAt = $1
       WHERE isDefault = 1 AND deletedAt IS NULL`,
      [updatedAt],
    );
  }
}
