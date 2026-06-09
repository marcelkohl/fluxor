import type {
  CreateTransferLinkData,
  TransferLink,
} from "@/features/financial-records/domain";

export interface TransferLinkRepositoryPort {
  create(data: CreateTransferLinkData): Promise<TransferLink>;
  getById(id: string): Promise<TransferLink | null>;
}
