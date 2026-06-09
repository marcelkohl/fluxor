import type { Category, FinancialRecord, Payee } from "@/features/home/types";
import type { HomeFiltersState } from "@/features/home/state";
import type { HomeWidgetDataContext } from "@/features/widgets/types";

export function buildHomeWidgetContext(input: {
  walletId: string;
  selectedMonth: number;
  selectedYear: number;
  records: FinancialRecord[];
  filters: HomeFiltersState;
  categoriesById: Record<string, Category>;
  payeesById: Record<string, Payee>;
  previousBalanceCents: number;
}): HomeWidgetDataContext {
  return input;
}
