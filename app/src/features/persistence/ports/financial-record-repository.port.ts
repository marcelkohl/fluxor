import type {
  CreateFinancialRecordData,
  FinancialRecord,
  ListFinancialRecordsFilter,
  RegisterPaymentData,
  UpdateFinancialRecordData,
} from "@/features/financial-records/domain";

export interface FinancialRecordRepositoryPort {
  create(data: CreateFinancialRecordData): Promise<FinancialRecord>;
  update(id: string, data: UpdateFinancialRecordData): Promise<FinancialRecord>;
  registerPayment(
    id: string,
    data: RegisterPaymentData,
  ): Promise<FinancialRecord>;
  revertPayment(id: string): Promise<FinancialRecord>;
  archive(id: string): Promise<FinancialRecord>;
  getById(id: string): Promise<FinancialRecord | null>;
  list(filter?: ListFinancialRecordsFilter): Promise<FinancialRecord[]>;
}
