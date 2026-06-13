export type FinancialRecordType = "payable" | "receivable";

export type StoredStatus = "pending" | "completed";

export interface FinancialRecord {
  id: string;
  walletId: string;
  type: FinancialRecordType;
  description: string;
  payeeId: string | null;
  categoryId: string;
  dueDate: string;
  expectedAmount: number;
  effectiveDate: string | null;
  effectiveAmount: number | null;
  recordNote: string | null;
  paymentNote: string | null;
  storedStatus: StoredStatus;
  recurrenceGroupId: string | null;
  recurrenceIndex: number | null;
  alertEnabled: boolean;
  alertOffset: number | null;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateFinancialRecordData {
  walletId: string;
  type: FinancialRecordType;
  description: string;
  categoryId: string;
  dueDate: string;
  expectedAmount: number;
  payeeId?: string | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
  recurrenceGroupId?: string | null;
  recurrenceIndex?: number | null;
  transferGroupId?: string | null;
  storedStatus?: StoredStatus;
  effectiveDate?: string | null;
  effectiveAmount?: number | null;
  paymentNote?: string | null;
}

export interface UpdateFinancialRecordData {
  walletId?: string;
  type?: FinancialRecordType;
  description?: string;
  categoryId?: string;
  dueDate?: string;
  expectedAmount?: number;
  payeeId?: string | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
  transferGroupId?: string | null;
  scope?: import("@fluxor/contracts").RecurrenceScope;
}

export interface ListFinancialRecordsFilter {
  walletId?: string;
}

export interface RegisterPaymentData {
  effectiveDate: string;
  effectiveAmount: number;
  paymentNote: string | null;
}
