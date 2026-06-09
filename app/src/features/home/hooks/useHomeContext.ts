import { useEffect, useMemo, useSyncExternalStore } from "react";
import type {
  HomeContextState,
  RecordDayGroup,
  AccountWallet,
  FinancialRecord,
} from "@/features/home/types";
import type { HomeState } from "@/features/home/state";
import { homeStateService } from "@/features/home/state";
import type { HomeWidgetDataContext } from "@/features/widgets/types";
import {
  applyHomeFilters,
  groupRecordsByDate,
  isSameMonth,
} from "@/features/home/utils";
import { buildHomeWidgetContext } from "@/features/home/utils/build-home-widget-context";
import { calculatePreviousBalanceCents } from "@/features/home/utils/calculate-previous-balance-cents";

export interface UseHomeContextResult {
  homeState: HomeState;
  context: HomeContextState;
  widgetContext: HomeWidgetDataContext;
  /** Registros do mês selecionado, antes dos filtros da Home. */
  monthRecords: HomeContextState["records"];
  groupedRecords: RecordDayGroup[];
}

function buildHomeContext(
  homeState: HomeState,
  records: HomeContextState["records"],
  activeAccount: AccountWallet,
  referenceDate: string,
): HomeContextState {
  return {
    activeAccount,
    selectedMonth: {
      year: homeState.selectedYear,
      month: homeState.selectedMonth,
    },
    filters: homeState.filters,
    records,
    referenceDate,
    enabledWidgetIds: homeState.enabledWidgetIds,
    activeWidgetId: homeState.activeWidgetId,
  };
}

export function useHomeContext(
  activeAccount: AccountWallet,
  accountRecords: FinancialRecord[],
  referenceDate: string,
  categoriesById: HomeWidgetDataContext["categoriesById"],
  payeesById: HomeWidgetDataContext["payeesById"],
): UseHomeContextResult {
  const homeState = useSyncExternalStore(
    (listener) => homeStateService.subscribe(listener),
    () => homeStateService.getState(),
    () => homeStateService.getState(),
  );

  const monthRecords = useMemo(() => {
    return accountRecords.filter((record) =>
      isSameMonth(
        record.date,
        homeState.selectedYear,
        homeState.selectedMonth,
      ),
    );
  }, [accountRecords, homeState.selectedMonth, homeState.selectedYear]);

  const filteredRecords = useMemo(
    () => applyHomeFilters(monthRecords, homeState.filters),
    [monthRecords, homeState.filters],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const monthMismatch =
      accountRecords.length > 0 && monthRecords.length === 0;

    console.debug("[HomeContext] filter pipeline", {
      activeAccountId: homeState.activeAccountId,
      selectedMonth: homeState.selectedMonth,
      selectedYear: homeState.selectedYear,
      loadedCount: accountRecords.length,
      afterMonthFilterCount: monthRecords.length,
      afterHomeFiltersCount: filteredRecords.length,
      monthMismatch,
      monthMismatchHint: monthMismatch
        ? "Registros existem, mas nenhum cai no mês selecionado na Home"
        : undefined,
      loadedDates: accountRecords.map((record) => record.date),
    });
  }, [
    accountRecords,
    filteredRecords.length,
    homeState.activeAccountId,
    homeState.selectedMonth,
    homeState.selectedYear,
    monthRecords.length,
  ]);

  const context = useMemo(
    () =>
      buildHomeContext(
        homeState,
        filteredRecords,
        activeAccount,
        referenceDate,
      ),
    [homeState, filteredRecords, activeAccount, referenceDate],
  );

  const previousBalanceCents = useMemo(
    () =>
      calculatePreviousBalanceCents(
        accountRecords,
        homeState.selectedYear,
        homeState.selectedMonth,
      ),
    [accountRecords, homeState.selectedMonth, homeState.selectedYear],
  );

  const widgetContext = useMemo(
    () =>
      buildHomeWidgetContext({
        walletId: homeState.activeAccountId,
        selectedMonth: homeState.selectedMonth,
        selectedYear: homeState.selectedYear,
        records: filteredRecords,
        filters: homeState.filters,
        categoriesById,
        payeesById,
        previousBalanceCents,
      }),
    [
      categoriesById,
      filteredRecords,
      homeState.activeAccountId,
      homeState.filters,
      homeState.selectedMonth,
      homeState.selectedYear,
      payeesById,
      previousBalanceCents,
    ],
  );

  const groupedRecords = useMemo(
    () => groupRecordsByDate(filteredRecords),
    [filteredRecords],
  );

  return {
    homeState,
    context,
    widgetContext,
    monthRecords,
    groupedRecords,
  };
}
