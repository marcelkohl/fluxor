import type { EntityId } from "../common/ids";
import type {
  CreateFinancialRecordRequest,
  FinancialRecordResponse,
} from "./financial-record.contracts";
import type { RecurrenceRule } from "./recurrence-rule.contracts";

export type {
  RecurrenceEnd,
  RecurrenceFrequency,
  RecurrenceRule,
  RecurrenceWeekdayPosition,
} from "./recurrence-rule.contracts";

export interface RecurringFinancialRecordTemplate
  extends Omit<
    CreateFinancialRecordRequest,
    | "recurrenceGroupId"
    | "recurrenceIndex"
    | "transferGroupId"
    | "storedStatus"
    | "effectiveDate"
    | "effectiveAmount"
    | "paymentNote"
  > {}

export interface CreateRecurringFinancialRecordsRequest {
  record: RecurringFinancialRecordTemplate;
  recurrence: RecurrenceRule;
}

export interface CreateRecurringFinancialRecordsResponse {
  batchId: EntityId;
  records: FinancialRecordResponse[];
}
