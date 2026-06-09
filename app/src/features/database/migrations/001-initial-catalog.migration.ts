import type { MigrationDefinition } from "./migration.types";

/**
 * Migration inicial — cadastros base (schema V1).
 * Ref: docs/sqlite-schema-v1.md §3.1–3.5
 */
export const migration001InitialCatalog: MigrationDefinition = {
  version: 1,
  description: "initial_catalog",
  up: [
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS wallet (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      notes TEXT,
      isDefault INTEGER NOT NULL DEFAULT 0 CHECK (isDefault IN (0, 1)),
      isArchived INTEGER NOT NULL DEFAULT 0 CHECK (isArchived IN (0, 1)),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      isArchived INTEGER NOT NULL DEFAULT 0 CHECK (isArchived IN (0, 1)),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS payee (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      isArchived INTEGER NOT NULL DEFAULT 0 CHECK (isArchived IN (0, 1)),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS payee_document (
      id TEXT PRIMARY KEY NOT NULL,
      payeeId TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (payeeId) REFERENCES payee(id)
    )`,
    `CREATE TABLE IF NOT EXISTS payee_payment_method (
      id TEXT PRIMARY KEY NOT NULL,
      payeeId TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (payeeId) REFERENCES payee(id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_wallet_is_default ON wallet (isDefault)",
    "CREATE INDEX IF NOT EXISTS idx_wallet_active ON wallet (isArchived, deletedAt)",
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_single_active_default
      ON wallet (isDefault)
      WHERE isDefault = 1 AND deletedAt IS NULL AND isArchived = 0`,
    "CREATE INDEX IF NOT EXISTS idx_category_active ON category (deletedAt, isArchived)",
    "CREATE INDEX IF NOT EXISTS idx_payee_active ON payee (deletedAt, isArchived)",
    "CREATE INDEX IF NOT EXISTS idx_payee_document_payee ON payee_document (payeeId)",
    "CREATE INDEX IF NOT EXISTS idx_payee_payment_method_payee ON payee_payment_method (payeeId)",
  ],
};
