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

export interface FinancialRecordHistoryEvent {
  id: string;
  recordId: string;
  eventType: HistoryEventType;
  description: string;
  metadata: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface AppendHistoryEventData {
  recordId: string;
  eventType: HistoryEventType;
  description: string;
  metadata?: string | null;
  createdBy?: string | null;
}
