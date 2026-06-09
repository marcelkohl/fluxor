import type {
  CategoryRepositoryPort,
  FinancialRecordRepositoryPort,
  PayeeRepositoryPort,
  WalletRepositoryPort,
} from "../ports/index.js";
import type { FinancialRecordHistoryRepositoryPort } from "../ports/financial-record-history-repository.port.js";

export interface PersistenceProvider {
  wallets: WalletRepositoryPort;
  categories: CategoryRepositoryPort;
  payees: PayeeRepositoryPort;
  financialRecords: FinancialRecordRepositoryPort;
  financialRecordHistory: FinancialRecordHistoryRepositoryPort;
}
