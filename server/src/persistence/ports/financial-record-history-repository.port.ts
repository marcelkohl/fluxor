import type {
  AppendHistoryEventRequest,
  EntityId,
  FinancialRecordHistoryResponse,
  ListHistoryResponse,
} from "@fluxor/contracts";

export interface AppendHistoryEventInput extends AppendHistoryEventRequest {
  recordId: EntityId;
}

export interface FinancialRecordHistoryRepositoryPort {
  appendEvent(
    data: AppendHistoryEventInput,
  ): Promise<FinancialRecordHistoryResponse>;
  listByRecord(recordId: EntityId): Promise<ListHistoryResponse>;
}
