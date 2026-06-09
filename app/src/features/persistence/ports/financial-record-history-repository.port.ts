import type {
  AppendHistoryEventData,
  FinancialRecordHistoryEvent,
} from "@/features/financial-records/domain";

export interface FinancialRecordHistoryRepositoryPort {
  appendEvent(
    data: AppendHistoryEventData,
  ): Promise<FinancialRecordHistoryEvent>;
  listByRecord(recordId: string): Promise<FinancialRecordHistoryEvent[]>;
}
