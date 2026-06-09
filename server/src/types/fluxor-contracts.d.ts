/**
 * Declarações de tipos para @fluxor/contracts.
 * Evita compilar o pacote TypeScript do app no build do server.
 * Mantenha alinhado com app/packages/contracts.
 */
declare module "@fluxor/contracts" {
  export type EntityId = string;
  export type IsoDate = string;
  export type IsoDateTime = string;
  export type MoneyCents = number;

  export interface PaginationRequest {
    page?: number;
    pageSize?: number;
  }

  export interface PaginationResponse {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }

  export interface PaginatedListResponse<T> {
    items: T[];
    pagination: PaginationResponse;
  }

  export type ApiErrorCode =
    | "validation_error"
    | "invalid_date"
    | "invalid_amount"
    | "wallet_not_found"
    | "wallet_archived"
    | "wallet_archived_cannot_be_default"
    | "category_not_found"
    | "payee_not_found"
    | "financial_record_not_found"
    | "financial_record_already_completed"
    | "financial_record_not_completed"
    | "financial_record_is_transfer"
    | "attachment_not_found"
    | "transfer_link_not_found"
    | "recurrence_batch_not_found"
    | "no_fields_to_update";

  export interface ApiErrorResponse {
    code: ApiErrorCode;
    message: string;
  }

  export interface CreateWalletRequest {
    name: string;
    icon: string;
    color: string;
    notes?: string | null;
    isDefault?: boolean;
  }

  export interface UpdateWalletRequest {
    name?: string;
    icon?: string;
    color?: string;
    notes?: string | null;
  }

  export interface WalletResponse {
    id: EntityId;
    name: string;
    icon: string;
    color: string;
    notes: string | null;
    isDefault: boolean;
    isArchived: boolean;
    createdAt: IsoDateTime;
    updatedAt: IsoDateTime;
    deletedAt: IsoDateTime | null;
  }

  export type ListWalletsRequest = PaginationRequest;
  export type ListWalletsResponse =
    | WalletResponse[]
    | PaginatedListResponse<WalletResponse>;

  export interface CreateCategoryRequest {
    name: string;
    icon: string;
    color: string;
    description?: string | null;
  }

  export interface UpdateCategoryRequest {
    name?: string;
    icon?: string;
    color?: string;
    description?: string | null;
  }

  export interface CategoryResponse {
    id: EntityId;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    isArchived: boolean;
    createdAt: IsoDateTime;
    updatedAt: IsoDateTime;
    deletedAt: IsoDateTime | null;
  }

  export type ListCategoriesRequest = PaginationRequest;
  export type ListCategoriesResponse =
    | CategoryResponse[]
    | PaginatedListResponse<CategoryResponse>;

  export interface CreatePayeeRequest {
    name: string;
    notes?: string | null;
  }

  export interface UpdatePayeeRequest {
    name?: string;
    notes?: string | null;
  }

  export interface PayeeResponse {
    id: EntityId;
    name: string;
    notes: string | null;
    isArchived: boolean;
    createdAt: IsoDateTime;
    updatedAt: IsoDateTime;
    deletedAt: IsoDateTime | null;
  }

  export type ListPayeesRequest = PaginationRequest;
  export type ListPayeesResponse =
    | PayeeResponse[]
    | PaginatedListResponse<PayeeResponse>;

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
    description?: string;
    categoryId?: EntityId;
    dueDate?: IsoDate;
    expectedAmount?: MoneyCents;
    payeeId?: EntityId | null;
    recordNote?: string | null;
    alertEnabled?: boolean;
    alertOffset?: number | null;
    transferGroupId?: EntityId | null;
  }

  export interface RegisterPaymentRequest {
    effectiveDate: IsoDate;
    effectiveAmount: MoneyCents;
    paymentNote?: string | null;
  }

  export type RevertPaymentRequest = Record<string, never>;

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
    status?: StoredStatus;
    startDate?: IsoDate;
    endDate?: IsoDate;
  }

  export type ListFinancialRecordsResponse =
    | FinancialRecordResponse[]
    | PaginatedListResponse<FinancialRecordResponse>;
}
