import type { IsoDate, IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";
import type { MoneyCents } from "../common/money";
import type {
  PaginatedListResponse,
  PaginationRequest,
} from "../common/pagination";
import type { RecurrenceScope } from "./recurrence-scope.contracts";

export type { RecurrenceScope } from "./recurrence-scope.contracts";

export type FinancialRecordType = "payable" | "receivable";

export type StoredStatus = "pending" | "completed";

export interface CreateFinancialRecordRequest {
  walletId: EntityId;
  type: FinancialRecordType;
  description: string;
  categoryId: EntityId;
  dueDate: IsoDate;
  expectedAmount: MoneyCents;
  payeeId?: EntityId | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
  recurrenceGroupId?: EntityId | null;
  recurrenceIndex?: number | null;
  transferGroupId?: EntityId | null;
  storedStatus?: StoredStatus;
  effectiveDate?: IsoDate | null;
  effectiveAmount?: MoneyCents | null;
  paymentNote?: string | null;
}

export interface UpdateFinancialRecordRequest {
  walletId?: EntityId;
  type?: FinancialRecordType;
  description?: string;
  categoryId?: EntityId;
  dueDate?: IsoDate;
  expectedAmount?: MoneyCents;
  payeeId?: EntityId | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
  transferGroupId?: EntityId | null;
  scope?: RecurrenceScope;
}

export interface ArchiveFinancialRecordRequest {
  scope?: RecurrenceScope;
}

export interface RegisterPaymentRequest {
  effectiveDate: IsoDate;
  effectiveAmount: MoneyCents;
  paymentNote?: string | null;
}

/** Corpo vazio `{}` ou omitido — ver POST …/revert-payment */
export type RevertPaymentRequest = Record<string, never>;

export interface FinancialRecordResponse {
  id: EntityId;
  walletId: EntityId;
  type: FinancialRecordType;
  description: string;
  payeeId: EntityId | null;
  categoryId: EntityId;
  dueDate: IsoDate;
  expectedAmount: MoneyCents;
  effectiveDate: IsoDate | null;
  effectiveAmount: MoneyCents | null;
  recordNote: string | null;
  paymentNote: string | null;
  storedStatus: StoredStatus;
  recurrenceGroupId: EntityId | null;
  recurrenceIndex: number | null;
  alertEnabled: boolean;
  alertOffset: number | null;
  transferGroupId: EntityId | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface ListFinancialRecordsRequest extends PaginationRequest {
  walletId?: EntityId;
  categoryId?: EntityId;
  payeeId?: EntityId;
  type?: FinancialRecordType;
  /** Filtra por `storedStatus` (`pending` | `completed`). */
  status?: StoredStatus;
  /** Filtra `dueDate >= startDate` (inclusive). */
  startDate?: IsoDate;
  /** Filtra `dueDate <= endDate` (inclusive). */
  endDate?: IsoDate;
}

export type ListFinancialRecordsResponse =
  | FinancialRecordResponse[]
  | PaginatedListResponse<FinancialRecordResponse>;
