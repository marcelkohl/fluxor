import { HomeHeader } from "../HomeHeader";
import { MonthNavigator } from "../MonthNavigator";
import { RecordList } from "../RecordList";
import { WidgetCarousel } from "../WidgetCarousel";
import type { HomeLayoutProps } from "./home-layout.types";

export function HomeMobileLayout({
  account,
  hasWallets,
  isWalletsLoading,
  context,
  groupedRecords,
  categoriesById,
  widgetContext,
  activeFilterCount,
  recordsError,
  isRecordsLoading,
  isBrowserFallback,
  highlightedDate,
  onOpenWalletPicker,
  onAddRecord,
  onPreviousMonth,
  onNextMonth,
  onOpenExport,
  onOpenFilters,
  onActiveWidgetChange,
  onQuickSettle,
}: HomeLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <HomeHeader
          account={account}
          walletSelectorDisabled={isWalletsLoading || !hasWallets}
          onOpenWalletPicker={onOpenWalletPicker}
          onAddRecord={onAddRecord}
        />

        <MonthNavigator
          selectedMonth={context.selectedMonth}
          activeFilterCount={activeFilterCount}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
          onOpenExport={onOpenExport}
          onOpenFilters={onOpenFilters}
        />

        <div className="py-2">
          <WidgetCarousel
            widgetContext={widgetContext}
            enabledWidgetIds={context.enabledWidgetIds}
            activeWidgetId={context.activeWidgetId}
            onActiveWidgetChange={onActiveWidgetChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {recordsError ? (
          <p className="mx-4 mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
            {recordsError}
          </p>
        ) : null}

        {isRecordsLoading && !isBrowserFallback ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">
            Carregando registros…
          </p>
        ) : (
          <RecordList
            groups={groupedRecords}
            referenceDate={context.referenceDate}
            categoriesById={categoriesById}
            highlightedDate={highlightedDate}
            swipeEnabled={!isBrowserFallback}
            onQuickSettle={onQuickSettle}
          />
        )}
      </div>
    </div>
  );
}
