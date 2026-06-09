import type { HomeState } from "./home-state.types";
import { createEmptyHomeFiltersState } from "./home-state.types";

const now = new Date();

/** Estado operacional inicial da Home (memória). */
export const initialHomeState: HomeState = {
  activeAccountId: "account-pessoal",
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  activeWidgetId: "financial-summary",
  enabledWidgetIds: [
    "financial-summary",
    "financial-calendar",
    "category-bars",
  ],
  filters: createEmptyHomeFiltersState(),
};
