import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ToastBanner } from "@/components/ToastBanner";
import { exportHomeReport, HomeExportSheet } from "@/features/export";
import type { HomeExportFormat } from "@/features/export";
import { registerPayment } from "@/features/financial-records/application";
import { useHomeContext } from "@/features/home/hooks/useHomeContext";
import { useHomeFinancialRecords } from "@/features/home/hooks/useHomeFinancialRecords";
import { useHomeWallets } from "@/features/home/hooks/useHomeWallets";
import { homeStateService } from "@/features/home/state";
import type { FinancialRecord } from "@/features/home/types";
import type { HomeWidgetContext } from "@/features/widgets/types";
import { countActiveFilters } from "@/features/home/utils";
import { todayIsoDate } from "@/features/home/utils/domain-record-to-home-record";
import { HomeDesktopLayout } from "./layout/HomeDesktopLayout";
import { HomeMobileLayout } from "./layout/HomeMobileLayout";
import type { HomeLayoutProps } from "./layout/home-layout.types";
import { HomeFiltersSheet } from "./filters/HomeFiltersSheet";
import { WalletPickerSheet } from "./WalletPickerSheet";

interface HomeLocationState {
  toast?: string;
  focusDueDate?: string;
}

export function HomeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, activeAccount, hasWallets, isLoading } = useHomeWallets();
  const {
    records,
    categoriesById,
    payeesById,
    referenceDate,
    isLoading: isRecordsLoading,
    error: recordsError,
    isBrowserFallback,
    reload: reloadRecords,
  } = useHomeFinancialRecords(location.key);
  const { homeState, context, widgetContext, groupedRecords, monthRecords } =
    useHomeContext(
      activeAccount,
      records,
      referenceDate,
      categoriesById,
      payeesById,
    );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const activeFilterCount = countActiveFilters(homeState.filters);

  useEffect(() => {
    const state = location.state as HomeLocationState | null;
    if (state?.focusDueDate) {
      homeStateService.setSelectedMonthFromIsoDate(state.focusDueDate);
    }
    if (state?.toast) {
      setToastMessage(state.toast);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const handleQuickSettle = useCallback(
    async (record: FinancialRecord) => {
      try {
        await registerPayment({
          recordId: record.id,
          effectiveDate: todayIsoDate(),
          effectiveAmount: record.expectedAmountCents,
          paymentNote: null,
        });
        reloadRecords();
        setToastMessage(
          record.type === "payable"
            ? "Pagamento registrado"
            : "Recebimento registrado",
        );
      } catch (error) {
        setToastMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível efetivar o registro",
        );
        throw error;
      }
    },
    [reloadRecords],
  );

  function handleClearFilters() {
    homeStateService.resetFilters();
    setIsFiltersOpen(false);
  }

  function handleApplyFilters(nextFilters: typeof homeState.filters) {
    homeStateService.setFilters(nextFilters);
    setIsFiltersOpen(false);
  }

  function handleCloseFilters() {
    setIsFiltersOpen(false);
  }

  function handleCloseWalletPicker() {
    setIsWalletPickerOpen(false);
  }

  function handleSelectWallet(accountId: string) {
    homeStateService.setActiveAccount(accountId);
  }

  const handleActiveWidgetChange = useCallback((widgetId: string) => {
    homeStateService.setActiveWidget(widgetId);
  }, []);

  const handleExport = useCallback(
    async (format: HomeExportFormat) => {
      try {
        const savedPath = await exportHomeReport(
          {
            walletName: activeAccount.name,
            selectedMonth: context.selectedMonth.month,
            selectedYear: context.selectedMonth.year,
            records: context.records,
            previousBalanceCents: widgetContext.previousBalanceCents,
            generatedAt: new Date(),
          },
          format,
        );

        if (!savedPath) {
          return;
        }

        setToastMessage(`Relatório salvo em:\n${savedPath}`);
      } catch (error) {
        setToastMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível exportar o relatório",
        );
      }
    },
    [
      activeAccount.name,
      context.records,
      context.selectedMonth.month,
      context.selectedMonth.year,
      widgetContext.previousBalanceCents,
    ],
  );

  const handleNavigateToDate = useCallback(
    (date: string) => {
      const hasGroup = groupedRecords.some((group) => group.date === date);

      if (!hasGroup) {
        return;
      }

      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      setHighlightedDate(date);

      requestAnimationFrame(() => {
        document.getElementById(`record-group-${date}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedDate(null);
        highlightTimeoutRef.current = null;
      }, 3000);
    },
    [groupedRecords],
  );

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const widgetContextWithNavigation = useMemo(
    (): HomeWidgetContext => ({
      ...widgetContext,
      navigateToDate: handleNavigateToDate,
    }),
    [handleNavigateToDate, widgetContext],
  );

  const layoutProps: HomeLayoutProps = {
    account: activeAccount,
    hasWallets,
    isWalletsLoading: isLoading,
    context,
    groupedRecords,
    categoriesById,
    widgetContext: widgetContextWithNavigation,
    activeFilterCount,
    recordsError,
    isRecordsLoading,
    isBrowserFallback,
    highlightedDate,
    onOpenWalletPicker: () => setIsWalletPickerOpen(true),
    onAddRecord: () => navigate("/records/new"),
    onPreviousMonth: () => homeStateService.shiftSelectedMonth(-1),
    onNextMonth: () => homeStateService.shiftSelectedMonth(1),
    onOpenExport: () => setIsExportOpen(true),
    onOpenFilters: () => setIsFiltersOpen(true),
    onActiveWidgetChange: handleActiveWidgetChange,
    onQuickSettle: handleQuickSettle,
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full min-h-0 flex-1 lg:hidden">
          <HomeMobileLayout {...layoutProps} />
        </div>

        <div className="hidden h-full min-h-0 flex-1 lg:block">
          <HomeDesktopLayout {...layoutProps} />
        </div>
      </div>

      <HomeFiltersSheet
        isOpen={isFiltersOpen}
        filters={homeState.filters}
        categoriesById={categoriesById}
        payeesById={payeesById}
        previewRecords={monthRecords}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <HomeExportSheet
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
      />

      <WalletPickerSheet
        isOpen={isWalletPickerOpen}
        accounts={accounts}
        selectedAccountId={homeState.activeAccountId}
        onSelect={handleSelectWallet}
        onClose={handleCloseWalletPicker}
      />

      {toastMessage ? (
        <ToastBanner message={toastMessage} onDismiss={dismissToast} />
      ) : null}
    </>
  );
}
