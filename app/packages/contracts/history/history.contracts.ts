import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";

export type HistoryEventType =
  | "record_created"
  | "record_updated"
  | "payment_registered"
  | "payment_reverted"
  | "attachment_added"
  | "attachment_removed"
  | "transfer_created"
  | "transfer_updated"
  | "alert_created";

export interface AppendHistoryEventRequest {
  eventType: HistoryEventType;
  description: string;
  metadata?: string | null;
  createdBy?: string | null;
}

export interface FinancialRecordHistoryResponse {
  id: EntityId;
  recordId: EntityId;
  eventType: HistoryEventType;
  description: string;
  metadata: string | null;
  createdAt: IsoDateTime;
  createdBy: string | null;
}

export type ListHistoryResponse = FinancialRecordHistoryResponse[];
