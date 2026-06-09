import type {
  AccountWallet,
  FinancialRecord,
  SelectedMonth,
} from "./financial.types";
import type { HomeFiltersState } from "@/features/home/state";

export type { HomeFiltersState };

/**
 * Visão composta da Home para componentes e widgets.
 * Combina estado operacional (HomeState) + dados financeiros mockados.
 */
export interface HomeContextState {
  activeAccount: AccountWallet;
  selectedMonth: SelectedMonth;
  filters: HomeFiltersState;
  records: FinancialRecord[];
  /** Data de referência usada como "hoje" no mock (2026-05-10). */
  referenceDate: string;
  enabledWidgetIds: string[];
  activeWidgetId: string;
}
