import type {
  CreateFinancialRecordRequest,
  FinancialRecordResponse,
  ListFinancialRecordsRequest,
  ListFinancialRecordsResponse,
  RegisterPaymentRequest,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";

export interface FinancialRecordRepositoryPort {
  create(
    data: CreateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse>;
  update(
    id: string,
    data: UpdateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse>;
  registerPayment(
    id: string,
    data: RegisterPaymentRequest,
  ): Promise<FinancialRecordResponse>;
  revertPayment(id: string): Promise<FinancialRecordResponse>;
  list(
    request?: ListFinancialRecordsRequest,
  ): Promise<ListFinancialRecordsResponse>;
  getById(id: string): Promise<FinancialRecordResponse | null>;
  archive(id: string): Promise<FinancialRecordResponse>;
  listByRecurrenceGroup(
    recurrenceGroupId: string,
    options?: { minRecurrenceIndex?: number },
  ): Promise<FinancialRecordResponse[]>;
}
