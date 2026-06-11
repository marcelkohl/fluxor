import type {
  CategoryRepositoryPort,
  FinancialRecordRepositoryPort,
  PayeeRepositoryPort,
  WalletRepositoryPort,
} from "../ports/index.js";
import type { AttachmentRepositoryPort } from "../ports/attachment-repository.port.js";
import type { FinancialRecordHistoryRepositoryPort } from "../ports/financial-record-history-repository.port.js";

export interface PersistenceProvider {
  wallets: WalletRepositoryPort;
  categories: CategoryRepositoryPort;
  payees: PayeeRepositoryPort;
  financialRecords: FinancialRecordRepositoryPort;
  attachments: AttachmentRepositoryPort;
  financialRecordHistory: FinancialRecordHistoryRepositoryPort;
}
