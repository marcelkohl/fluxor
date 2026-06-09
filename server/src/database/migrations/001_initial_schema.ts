import type { MigrationDefinition } from "./migration.types.js";

/**
 * Schema V1 — adaptado de app/docs/sqlite-schema-v1.md e migrations SQLite do app.
 *
 * Adaptações SQLite → MariaDB:
 * - UUID/TEXT → VARCHAR(36); textos longos → TEXT
 * - INTEGER centavos → BIGINT; booleanos → TINYINT(1)
 * - datas ISO date → DATE; timestamps → DATETIME(3)
 * - índice parcial único (carteira padrão / recurrenceIndex) → coluna gerada + UNIQUE
 * - utf8mb4 + InnoDB para FKs
 */
export const migration001InitialSchema: MigrationDefinition = {
  version: 1,
  name: "initial_schema",
  up: [
    "SET NAMES utf8mb4",

    `CREATE TABLE IF NOT EXISTS wallet (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      icon VARCHAR(128) NOT NULL,
      color VARCHAR(64) NOT NULL,
      notes TEXT NULL,
      isDefault TINYINT(1) NOT NULL DEFAULT 0,
      isArchived TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL,
      updatedAt DATETIME(3) NOT NULL,
      deletedAt DATETIME(3) NULL,
      activeDefaultKey VARCHAR(36) AS (
        IF(isDefault = 1 AND deletedAt IS NULL AND isArchived = 0, id, NULL)
      ) STORED,
      PRIMARY KEY (id),
      CONSTRAINT chk_wallet_is_default CHECK (isDefault IN (0, 1)),
      CONSTRAINT chk_wallet_is_archived CHECK (isArchived IN (0, 1)),
      UNIQUE KEY uq_wallet_single_active_default (activeDefaultKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS category (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      icon VARCHAR(128) NOT NULL,
      color VARCHAR(64) NOT NULL,
      description TEXT NULL,
      isArchived TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL,
      updatedAt DATETIME(3) NOT NULL,
      deletedAt DATETIME(3) NULL,
      PRIMARY KEY (id),
      CONSTRAINT chk_category_is_archived CHECK (isArchived IN (0, 1))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS payee (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      notes TEXT NULL,
      isArchived TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL,
      updatedAt DATETIME(3) NOT NULL,
      deletedAt DATETIME(3) NULL,
      PRIMARY KEY (id),
      CONSTRAINT chk_payee_is_archived CHECK (isArchived IN (0, 1))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS payee_document (
      id VARCHAR(36) NOT NULL,
      payeeId VARCHAR(36) NOT NULL,
      type VARCHAR(64) NOT NULL,
      value VARCHAR(255) NOT NULL,
      createdAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_payee_document_payee
        FOREIGN KEY (payeeId) REFERENCES payee (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS payee_payment_method (
      id VARCHAR(36) NOT NULL,
      payeeId VARCHAR(36) NOT NULL,
      type VARCHAR(64) NOT NULL,
      value VARCHAR(255) NOT NULL,
      createdAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_payee_payment_method_payee
        FOREIGN KEY (payeeId) REFERENCES payee (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS recurrence_batch (
      id VARCHAR(36) NOT NULL,
      ruleDescription TEXT NOT NULL,
      startDate DATE NOT NULL,
      endDate DATE NULL,
      occurrenceCount INT NOT NULL,
      createdAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS financial_record (
      id VARCHAR(36) NOT NULL,
      walletId VARCHAR(36) NOT NULL,
      type VARCHAR(16) NOT NULL,
      description VARCHAR(500) NOT NULL,
      payeeId VARCHAR(36) NULL,
      categoryId VARCHAR(36) NOT NULL,
      dueDate DATE NOT NULL,
      expectedAmount BIGINT NOT NULL,
      effectiveDate DATE NULL,
      effectiveAmount BIGINT NULL,
      recordNote TEXT NULL,
      paymentNote TEXT NULL,
      storedStatus VARCHAR(16) NOT NULL,
      recurrenceGroupId VARCHAR(36) NULL,
      recurrenceIndex INT NULL,
      alertEnabled TINYINT(1) NOT NULL DEFAULT 0,
      alertOffset INT NULL,
      transferGroupId VARCHAR(36) NULL,
      createdAt DATETIME(3) NOT NULL,
      updatedAt DATETIME(3) NOT NULL,
      deletedAt DATETIME(3) NULL,
      recurrenceIndexKey VARCHAR(80) AS (
        IF(
          recurrenceGroupId IS NOT NULL AND recurrenceIndex IS NOT NULL,
          CONCAT(recurrenceGroupId, ':', recurrenceIndex),
          NULL
        )
      ) STORED,
      PRIMARY KEY (id),
      CONSTRAINT chk_financial_record_type CHECK (type IN ('payable', 'receivable')),
      CONSTRAINT chk_financial_record_stored_status
        CHECK (storedStatus IN ('pending', 'completed')),
      CONSTRAINT chk_financial_record_alert_enabled CHECK (alertEnabled IN (0, 1)),
      CONSTRAINT fk_financial_record_wallet
        FOREIGN KEY (walletId) REFERENCES wallet (id),
      CONSTRAINT fk_financial_record_category
        FOREIGN KEY (categoryId) REFERENCES category (id),
      CONSTRAINT fk_financial_record_payee
        FOREIGN KEY (payeeId) REFERENCES payee (id),
      CONSTRAINT fk_financial_record_recurrence_batch
        FOREIGN KEY (recurrenceGroupId) REFERENCES recurrence_batch (id),
      UNIQUE KEY uq_financial_record_recurrence_index (recurrenceIndexKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS transfer_link (
      id VARCHAR(36) NOT NULL,
      sourceRecordId VARCHAR(36) NOT NULL,
      targetRecordId VARCHAR(36) NOT NULL,
      createdAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_transfer_link_source
        FOREIGN KEY (sourceRecordId) REFERENCES financial_record (id),
      CONSTRAINT fk_transfer_link_target
        FOREIGN KEY (targetRecordId) REFERENCES financial_record (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS attachment (
      id VARCHAR(36) NOT NULL,
      recordId VARCHAR(36) NOT NULL,
      kind VARCHAR(16) NOT NULL,
      label VARCHAR(255) NULL,
      filename VARCHAR(512) NOT NULL,
      mimeType VARCHAR(128) NOT NULL,
      size BIGINT NOT NULL,
      localPath VARCHAR(2048) NOT NULL,
      createdAt DATETIME(3) NOT NULL,
      deletedAt DATETIME(3) NULL,
      PRIMARY KEY (id),
      CONSTRAINT chk_attachment_kind CHECK (kind IN ('document', 'receipt')),
      CONSTRAINT fk_attachment_record
        FOREIGN KEY (recordId) REFERENCES financial_record (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS financial_record_history_event (
      id VARCHAR(36) NOT NULL,
      recordId VARCHAR(36) NOT NULL,
      eventType VARCHAR(64) NOT NULL,
      description TEXT NOT NULL,
      metadata JSON NULL,
      createdAt DATETIME(3) NOT NULL,
      createdBy VARCHAR(36) NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_history_event_record
        FOREIGN KEY (recordId) REFERENCES financial_record (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    "CREATE INDEX IF NOT EXISTS idx_wallet_is_default ON wallet (isDefault)",
    "CREATE INDEX IF NOT EXISTS idx_wallet_active ON wallet (isArchived, deletedAt)",
    "CREATE INDEX IF NOT EXISTS idx_category_active ON category (deletedAt, isArchived)",
    "CREATE INDEX IF NOT EXISTS idx_payee_active ON payee (deletedAt, isArchived)",
    "CREATE INDEX IF NOT EXISTS idx_payee_document_payee ON payee_document (payeeId)",
    "CREATE INDEX IF NOT EXISTS idx_payee_payment_method_payee ON payee_payment_method (payeeId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_due ON financial_record (walletId, dueDate)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_status_due ON financial_record (walletId, storedStatus, dueDate)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_wallet_deleted ON financial_record (walletId, deletedAt)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_category ON financial_record (categoryId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_payee ON financial_record (payeeId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_recurrence_group ON financial_record (recurrenceGroupId)",
    "CREATE INDEX IF NOT EXISTS idx_financial_record_transfer_group ON financial_record (transferGroupId)",
    "CREATE INDEX IF NOT EXISTS idx_transfer_link_source ON transfer_link (sourceRecordId)",
    "CREATE INDEX IF NOT EXISTS idx_transfer_link_target ON transfer_link (targetRecordId)",
    "CREATE INDEX IF NOT EXISTS idx_attachment_record_kind ON attachment (recordId, kind)",
    "CREATE INDEX IF NOT EXISTS idx_attachment_record_deleted ON attachment (recordId, deletedAt)",
    "CREATE INDEX IF NOT EXISTS idx_history_event_record_created ON financial_record_history_event (recordId, createdAt)",
  ],
};
