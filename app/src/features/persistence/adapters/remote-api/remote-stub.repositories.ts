import { RemoteFeatureNotSupportedError } from "@/features/persistence/errors/remote-feature-not-supported.error";
import type {
  AttachmentRepositoryPort,
  PayeeDocumentRepositoryPort,
  PayeePaymentMethodRepositoryPort,
  RecurrenceBatchRepositoryPort,
  TransferLinkRepositoryPort,
} from "@/features/persistence/ports";
import type {
  Attachment,
  CreateAttachmentData,
  CreateRecurrenceBatchData,
  CreateTransferLinkData,
  RecurrenceBatch,
  TransferLink,
} from "@/features/financial-records/domain";
import type {
  CreatePayeeDocumentData,
  CreatePayeePaymentMethodData,
  PayeeDocument,
  PayeePaymentMethod,
} from "@/features/payees/domain";

function notSupported(feature: string): never {
  throw new RemoteFeatureNotSupportedError(feature);
}

export class RemoteAttachmentRepository implements AttachmentRepositoryPort {
  async create(_data: CreateAttachmentData): Promise<Attachment> {
    return notSupported("attachments.create");
  }

  async remove(_id: string): Promise<Attachment> {
    return notSupported("attachments.remove");
  }

  async getById(_id: string): Promise<Attachment | null> {
    return null;
  }

  async listByRecord(_recordId: string): Promise<Attachment[]> {
    return [];
  }
}

export class RemoteTransferLinkRepository implements TransferLinkRepositoryPort {
  async create(_data: CreateTransferLinkData): Promise<TransferLink> {
    return notSupported("transferLinks.create");
  }

  async getById(_id: string): Promise<TransferLink | null> {
    return null;
  }
}

export class RemoteRecurrenceBatchRepository
  implements RecurrenceBatchRepositoryPort
{
  async create(_data: CreateRecurrenceBatchData): Promise<RecurrenceBatch> {
    return notSupported("recurrenceBatches.create");
  }

  async getById(_id: string): Promise<RecurrenceBatch | null> {
    return null;
  }
}

export class RemotePayeeDocumentRepository
  implements PayeeDocumentRepositoryPort
{
  async create(_data: CreatePayeeDocumentData): Promise<PayeeDocument> {
    return notSupported("payeeDocuments.create");
  }

  async listByPayee(_payeeId: string): Promise<PayeeDocument[]> {
    return [];
  }

  async getById(_id: string): Promise<PayeeDocument | null> {
    return null;
  }

  async remove(_id: string): Promise<void> {
    return notSupported("payeeDocuments.remove");
  }
}

export class RemotePayeePaymentMethodRepository
  implements PayeePaymentMethodRepositoryPort
{
  async create(
    _data: CreatePayeePaymentMethodData,
  ): Promise<PayeePaymentMethod> {
    return notSupported("payeePaymentMethods.create");
  }

  async listByPayee(_payeeId: string): Promise<PayeePaymentMethod[]> {
    return [];
  }

  async getById(_id: string): Promise<PayeePaymentMethod | null> {
    return null;
  }

  async remove(_id: string): Promise<void> {
    return notSupported("payeePaymentMethods.remove");
  }
}
