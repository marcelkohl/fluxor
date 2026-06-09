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
