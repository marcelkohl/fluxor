import type { WidgetDefinition } from "@/features/widgets/types";
import { CategoryBarsWidget } from "@/features/widgets/widgets/category-bars";
import { FinancialCalendarWidget } from "@/features/widgets/widgets/financial-calendar";
import { FinancialSummaryWidget } from "@/features/widgets/widgets/financial-summary";

export const widgetRegistry: WidgetDefinition[] = [
  {
    id: "financial-summary",
    name: "Resumo Financeiro",
    component: FinancialSummaryWidget,
  },
  {
    id: "financial-calendar",
    name: "Calendário Financeiro",
    component: FinancialCalendarWidget,
  },
  {
    id: "category-bars",
    name: "Valores por Categoria",
    component: CategoryBarsWidget,
  },
];
