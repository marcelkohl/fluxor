import type {
  CreatePayeeDocumentData,
  PayeeDocument,
} from "@/features/payees/domain";

export interface PayeeDocumentRepositoryPort {
  create(data: CreatePayeeDocumentData): Promise<PayeeDocument>;
  listByPayee(payeeId: string): Promise<PayeeDocument[]>;
  getById(id: string): Promise<PayeeDocument | null>;
  remove(id: string): Promise<void>;
}
