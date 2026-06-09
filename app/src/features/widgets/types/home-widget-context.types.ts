import type { Category, FinancialRecord, Payee } from "@/features/home/types";
import type { HomeFiltersState } from "@/features/home/state/home-state.types";

/**
 * Dados prontos que a Home entrega aos widgets.
 * Widgets não acessam SQLite, repositories ou use cases.
 */
export interface HomeWidgetContext {
  walletId: string;
  selectedMonth: number;
  selectedYear: number;
  records: FinancialRecord[];
  filters: HomeFiltersState;
  categoriesById: Record<string, Category>;
  payeesById: Record<string, Payee>;
  /** Saldo acumulado da carteira até o mês anterior ao selecionado (centavos). */
  previousBalanceCents: number;
  /** Navega até o grupo de registros do dia na lista da Home. */
  navigateToDate: (date: string) => void;
}

/** Dados do widget — montados pelo hook; a Home injeta `navigateToDate`. */
export type HomeWidgetDataContext = Omit<
  HomeWidgetContext,
  "navigateToDate"
>;
