import type { PersistenceProvider } from "@/features/persistence/providers/persistence-provider.types";

import { RemoteApiClient } from "./remote-api.client";
import { RemoteAttachmentRepository } from "./remote-attachment.repository";
import { RemoteCategoryRepository } from "./remote-category.repository";
import { RemoteFinancialRecordHistoryRepository } from "./remote-financial-record-history.repository";
import { RemoteFinancialRecordRepository } from "./remote-financial-record.repository";
import { RemotePayeeRepository } from "./remote-payee.repository";
import {
  RemotePayeeDocumentRepository,
  RemotePayeePaymentMethodRepository,
  RemoteTransferLinkRepository,
} from "./remote-stub.repositories";
import { RemoteRecurrenceBatchRepository } from "./remote-recurrence-batch.repository";
import { RemoteWalletRepository } from "./remote-wallet.repository";

export function createRemoteApiPersistenceProvider(
  remoteBaseUrl: string,
): PersistenceProvider {
  const client = new RemoteApiClient(remoteBaseUrl);

  return {
    wallets: new RemoteWalletRepository(client),
    categories: new RemoteCategoryRepository(client),
    payees: new RemotePayeeRepository(client),
    payeeDocuments: new RemotePayeeDocumentRepository(),
    payeePaymentMethods: new RemotePayeePaymentMethodRepository(),
    financialRecords: new RemoteFinancialRecordRepository(client),
    attachments: new RemoteAttachmentRepository(client),
    financialRecordHistory: new RemoteFinancialRecordHistoryRepository(client),
    transferLinks: new RemoteTransferLinkRepository(),
    recurrenceBatches: new RemoteRecurrenceBatchRepository(client),
  };
}
