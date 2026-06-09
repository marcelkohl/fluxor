/**
 * Filtros operacionais da Home (V1 — seleção única).
 * A carteira ativa é definida no cabeçalho, não faz parte dos filtros.
 */
export type HomeFilterType = "all" | "payable" | "receivable";

export type HomeFilterStatus =
  | "all"
  | "pending"
  | "completed"
  | "overdue"
  | "canceled";

export type HomeFilterDocumentState =
  | "all"
  | "withDocument"
  | "withoutDocument";

export type HomeFilterReceiptState =
  | "all"
  | "withReceipt"
  | "withoutReceipt";

export type HomeFilterRecurringState =
  | "all"
  | "recurring"
  | "nonRecurring";

export interface HomeFiltersState {
  startDate: string | null;
  endDate: string | null;
  type: HomeFilterType;
  status: HomeFilterStatus;
  categoryId: string | null;
  payeeId: string | null;
  minValue: number | null;
  maxValue: number | null;
  documentState: HomeFilterDocumentState;
  receiptState: HomeFilterReceiptState;
  recurringState: HomeFilterRecurringState;
}

/** Estado operacional da Home — independente dos dados financeiros. */
export interface HomeState {
  activeAccountId: string;
  selectedMonth: number;
  selectedYear: number;
  activeWidgetId: string;
  enabledWidgetIds: string[];
  filters: HomeFiltersState;
}

export function createEmptyHomeFiltersState(): HomeFiltersState {
  return {
    startDate: null,
    endDate: null,
    type: "all",
    status: "all",
    categoryId: null,
    payeeId: null,
    minValue: null,
    maxValue: null,
    documentState: "all",
    receiptState: "all",
    recurringState: "all",
  };
}
