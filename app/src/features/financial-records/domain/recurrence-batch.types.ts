export interface RecurrenceBatch {
  id: string;
  ruleDescription: string;
  startDate: string;
  endDate: string | null;
  occurrenceCount: number;
  createdAt: string;
}

export interface CreateRecurrenceBatchData {
  ruleDescription: string;
  startDate: string;
  endDate?: string | null;
  occurrenceCount: number;
}
