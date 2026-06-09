import type {
  HomeFilterDocumentState,
  HomeFilterReceiptState,
  HomeFilterRecurringState,
  HomeFilterStatus,
  HomeFilterType,
} from "@/features/home/state/home-state.types";

export const FILTER_ALL_CATEGORY = "__all__";
export const FILTER_ALL_PAYEE = "__all__";

export const FILTER_TYPE_OPTIONS = ["all", "payable", "receivable"] as const;
export const FILTER_STATUS_OPTIONS = [
  "all",
  "pending",
  "completed",
  "overdue",
  "canceled",
] as const;
export const FILTER_DOCUMENT_OPTIONS = [
  "all",
  "withDocument",
  "withoutDocument",
] as const;
export const FILTER_RECEIPT_OPTIONS = [
  "all",
  "withReceipt",
  "withoutReceipt",
] as const;
export const FILTER_RECURRING_OPTIONS = [
  "all",
  "recurring",
  "nonRecurring",
] as const;

export const FILTER_TYPE_LABELS: Record<HomeFilterType, string> = {
  all: "Todos",
  payable: "A pagar",
  receivable: "A receber",
};

export const FILTER_STATUS_LABELS: Record<HomeFilterStatus, string> = {
  all: "Todos",
  pending: "Pendente",
  completed: "Concluído",
  overdue: "Vencido",
  canceled: "Cancelado",
};

export const FILTER_DOCUMENT_LABELS: Record<
  HomeFilterDocumentState,
  string
> = {
  all: "Todos",
  withDocument: "Com documento",
  withoutDocument: "Sem documento",
};

export const FILTER_RECEIPT_LABELS: Record<HomeFilterReceiptState, string> = {
  all: "Todos",
  withReceipt: "Com comprovante",
  withoutReceipt: "Sem comprovante",
};

export const FILTER_RECURRING_LABELS: Record<
  HomeFilterRecurringState,
  string
> = {
  all: "Todos",
  recurring: "Recorrente",
  nonRecurring: "Não recorrente",
};
