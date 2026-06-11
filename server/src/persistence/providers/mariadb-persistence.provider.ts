import { MariadbAttachmentRepository } from "../adapters/mariadb/mariadb-attachment.repository.js";
import { MariadbCategoryRepository } from "../adapters/mariadb/mariadb-category.repository.js";
import { MariadbFinancialRecordHistoryRepository } from "../adapters/mariadb/mariadb-financial-record-history.repository.js";
import { MariadbFinancialRecordRepository } from "../adapters/mariadb/mariadb-financial-record.repository.js";
import { MariadbPayeeRepository } from "../adapters/mariadb/mariadb-payee.repository.js";
import { MariadbWalletRepository } from "../adapters/mariadb/mariadb-wallet.repository.js";
import type { PersistenceProvider } from "./persistence-provider.types.js";

export function createMariadbPersistenceProvider(): PersistenceProvider {
  const financialRecordHistory = new MariadbFinancialRecordHistoryRepository();

  return {
    wallets: new MariadbWalletRepository(),
    categories: new MariadbCategoryRepository(),
    payees: new MariadbPayeeRepository(),
    financialRecords: new MariadbFinancialRecordRepository(financialRecordHistory),
    attachments: new MariadbAttachmentRepository(),
    financialRecordHistory,
  };
}
