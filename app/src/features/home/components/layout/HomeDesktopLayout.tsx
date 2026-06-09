import { HomeHeader } from "../HomeHeader";
import { MonthNavigator } from "../MonthNavigator";
import { RecordList } from "../RecordList";
import { WidgetStack } from "../WidgetStack";
import type { HomeLayoutProps } from "./home-layout.types";

export function HomeDesktopLayout({
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
  onQuickSettle,
}: HomeLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border">
        <HomeHeader
          account={account}
          walletSelectorDisabled={isWalletsLoading || !hasWallets}
          onOpenWalletPicker={onOpenWalletPicker}
          onAddRecord={onAddRecord}
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-hidden px-5 py-4">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0">
            <MonthNavigator
              selectedMonth={context.selectedMonth}
              activeFilterCount={activeFilterCount}
              onPreviousMonth={onPreviousMonth}
              onNextMonth={onNextMonth}
              onOpenExport={onOpenExport}
              onOpenFilters={onOpenFilters}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {recordsError ? (
              <p className="mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
                {recordsError}
              </p>
            ) : null}

            {isRecordsLoading && !isBrowserFallback ? (
              <p className="py-8 text-center text-sm text-text-secondary">
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
        </section>

        <aside className="flex w-[22rem] shrink-0 flex-col overflow-hidden xl:w-[24rem]">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <WidgetStack
              widgetContext={widgetContext}
              enabledWidgetIds={context.enabledWidgetIds}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
