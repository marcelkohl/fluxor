import type {
  AttachmentRepositoryPort,
  CategoryRepositoryPort,
  FinancialRecordHistoryRepositoryPort,
  FinancialRecordRepositoryPort,
  PayeeDocumentRepositoryPort,
  PayeePaymentMethodRepositoryPort,
  PayeeRepositoryPort,
  RecurrenceBatchRepositoryPort,
  TransferLinkRepositoryPort,
  WalletRepositoryPort,
} from "../ports";

export interface PersistenceProvider {
  wallets: WalletRepositoryPort;
  categories: CategoryRepositoryPort;
  payees: PayeeRepositoryPort;
  payeeDocuments: PayeeDocumentRepositoryPort;
  payeePaymentMethods: PayeePaymentMethodRepositoryPort;
  financialRecords: FinancialRecordRepositoryPort;
  attachments: AttachmentRepositoryPort;
  financialRecordHistory: FinancialRecordHistoryRepositoryPort;
  transferLinks: TransferLinkRepositoryPort;
  recurrenceBatches: RecurrenceBatchRepositoryPort;
}
