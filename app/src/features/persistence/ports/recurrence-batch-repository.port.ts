import type {
  CreateRecurrenceBatchData,
  RecurrenceBatch,
} from "@/features/financial-records/domain";

export interface RecurrenceBatchRepositoryPort {
  create(data: CreateRecurrenceBatchData): Promise<RecurrenceBatch>;
  getById(id: string): Promise<RecurrenceBatch | null>;
}
