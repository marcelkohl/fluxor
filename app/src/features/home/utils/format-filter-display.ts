import type { HomeFiltersState } from "@/features/home/state/home-state.types";
import {
  FILTER_DOCUMENT_LABELS,
  FILTER_RECEIPT_LABELS,
  FILTER_RECURRING_LABELS,
  FILTER_STATUS_LABELS,
  FILTER_TYPE_LABELS,
} from "@/features/home/utils/home-filter-options";
import { formatCurrency, formatShortDate } from "@/features/home/utils/format";
import { formatCentsInputPreview } from "@/features/financial-records/utils/parse-expected-amount";

export interface FilterRowDisplay {
  label: string;
  value: string;
}

export interface FilterDisplayCatalogs {
  categoriesById?: Record<string, { name: string }>;
  payeesById?: Record<string, { name: string }>;
}

export function getFilterRowsDisplay(
  filters: HomeFiltersState,
  catalogs: FilterDisplayCatalogs = {},
): FilterRowDisplay[] {
  const categoryName = filters.categoryId
    ? (catalogs.categoriesById?.[filters.categoryId]?.name ?? filters.categoryId)
    : "Todas";

  const payeeName = filters.payeeId
    ? (catalogs.payeesById?.[filters.payeeId]?.name ?? filters.payeeId)
    : "Todos";

  return [
    {
      label: "Data Inicial",
      value: filters.startDate
        ? formatShortDate(filters.startDate)
        : "Não definida",
    },
    {
      label: "Data Final",
      value: filters.endDate ? formatShortDate(filters.endDate) : "Não definida",
    },
    { label: "Tipo", value: FILTER_TYPE_LABELS[filters.type] },
    { label: "Status", value: FILTER_STATUS_LABELS[filters.status] },
    { label: "Categoria", value: categoryName },
    { label: "Favorecido", value: payeeName },
    {
      label: "Valor mínimo",
      value:
        filters.minValue !== null
          ? formatCurrency(filters.minValue / 100)
          : "Não definido",
    },
    {
      label: "Valor máximo",
      value:
        filters.maxValue !== null
          ? formatCurrency(filters.maxValue / 100)
          : "Não definido",
    },
    { label: "Documento", value: FILTER_DOCUMENT_LABELS[filters.documentState] },
    { label: "Comprovante", value: FILTER_RECEIPT_LABELS[filters.receiptState] },
    { label: "Recorrente", value: FILTER_RECURRING_LABELS[filters.recurringState] },
  ];
}

export function formatFilterMoneyPreview(valueCents: number | null): string {
  if (valueCents === null) {
    return "Não definido";
  }

  return formatCentsInputPreview(valueCents);
}
