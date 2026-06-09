import type { MigrationDefinition } from "./migration.types";

/**
 * Migration v2 — FinancialRecord e entidades relacionadas (schema V1).
 * Ref: docs/sqlite-schema-v1.md §3.6–3.11, §6
 */
export const migration002FinancialRecords: MigrationDefinition = {
  version: 2,
  description: "financial_records",
  up: [
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS recurrence_batch (
      id TEXT PRIMARY KEY NOT NULL,
      ruleDescription TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      occurrenceCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS financial_record (
      id TEXT PRIMARY KEY NOT NULL,
      walletId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
      description TEXT NOT NULL,
      payeeId TEXT,
      categoryId TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      expectedAmount INTEGER NOT NULL,
      effectiveDate TEXT,
      effectiveAmount INTEGER,
      recordNote TEXT,
      paymentNote TEXT,
      storedStatus TEXT NOT NULL CHECK (storedStatus IN ('pending', 'completed')),
      recurrenceGroupId TEXT,
      recurrenceIndex INTEGER,
      alertEnabled INTEGER NOT NULL DEFAULT 0 CHECK (alertEnabled IN (0, 1)),
      alertOffset INTEGER,
      transferGroupId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (walletId) REFERENCES wallet(id),
      FOREIGN KEY (categoryId) REFERENCES category(id),
      FOREIGN KEY (payeeId) REFERENCES payee(id),
      FOREIGN KEY (recurrenceGroupId) REFERENCES recurrence_batch(id)
    )`,
    `CREATE TABLE IF NOT EXISTS transfer_link (
      id TEXT PRIMARY KEY NOT NULL,
      sourceRecordId TEXT NOT NULL,
      targetRecordId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (sourceRecordId) REFERENCES financial_record(id),
      FOREIGN KEY (targetRecordId) REFERENCES financial_record(id)
    )`,
    `CREATE TABLE IF NOT EXISTS attachment (
      id TEXT PRIMARY KEY NOT NULL,
      recordId TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('document', 'receipt')),
      label TEXT,
      filename TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      localPath TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (recordId) REFERENCES financial_record(id)
    )`,
    `CREATE TABLE IF NOT EXISTS financial_record_history_event (
      id TEXT PRIMARY KEY NOT NULL,
      recordId TEXT NOT NULL,
      eventType TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      createdBy TEXT,
      FOREIGN KEY (recordId) REFERENCES financial_record(id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_due ON financial_record (walletId, dueDate)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_status_due ON financial_record (walletId, storedStatus, dueDate)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_deleted ON financial_record (walletId, deletedAt)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_category ON financial_record (categoryId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_payee ON financial_record (payeeId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_recurrence_group ON financial_record (recurrenceGroupId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_transfer_group ON financial_record (transferGroupId)",
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_record_recurrence_index
      ON financial_record (recurrenceGroupId, recurrenceIndex)
      WHERE recurrenceGroupId IS NOT NULL AND recurrenceIndex IS NOT NULL`,
    "CREATE INDEX IF NOT EXISTS idx_transfer_link_source ON transfer_link (sourceRecordId)",
    "CREATE INDEX IF NOT EXISTS idx_transfer_link_target ON transfer_link (targetRecordId)",
    "CREATE INDEX IF NOT EXISTS idx_attachment_record_kind ON attachment (recordId, kind)",
    "CREATE INDEX IF NOT EXISTS idx_attachment_record_deleted ON attachment (recordId, deletedAt)",
    "CREATE INDEX IF NOT EXISTS idx_history_event_record_created ON financial_record_history_event (recordId, createdAt)",
  ],
};
