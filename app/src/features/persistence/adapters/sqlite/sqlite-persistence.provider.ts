import type { SqlDatabase } from "@/features/database";
import type { PersistenceProvider } from "@/features/persistence/providers/persistence-provider.types";

import { SqliteAttachmentRepository } from "./sqlite-attachment.repository";
import { SqliteCategoryRepository } from "./sqlite-category.repository";
import { SqliteFinancialRecordHistoryRepository } from "./sqlite-financial-record-history.repository";
import { SqliteFinancialRecordRepository } from "./sqlite-financial-record.repository";
import { SqlitePayeeDocumentRepository } from "./sqlite-payee-document.repository";
import { SqlitePayeePaymentMethodRepository } from "./sqlite-payee-payment-method.repository";
import { SqlitePayeeRepository } from "./sqlite-payee.repository";
import { SqliteRecurrenceBatchRepository } from "./sqlite-recurrence-batch.repository";
import { SqliteTransferLinkRepository } from "./sqlite-transfer-link.repository";
import { SqliteWalletRepository } from "./sqlite-wallet.repository";

export function createSqlitePersistenceProvider(
  db: SqlDatabase,
): PersistenceProvider {
  return {
    wallets: new SqliteWalletRepository(db),
    categories: new SqliteCategoryRepository(db),
    payees: new SqlitePayeeRepository(db),
    payeeDocuments: new SqlitePayeeDocumentRepository(db),
    payeePaymentMethods: new SqlitePayeePaymentMethodRepository(db),
    financialRecords: new SqliteFinancialRecordRepository(db),
    attachments: new SqliteAttachmentRepository(db),
    financialRecordHistory: new SqliteFinancialRecordHistoryRepository(db),
    transferLinks: new SqliteTransferLinkRepository(db),
    recurrenceBatches: new SqliteRecurrenceBatchRepository(db),
  };
}
