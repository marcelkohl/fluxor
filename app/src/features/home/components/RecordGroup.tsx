import type { Category, FinancialRecord, RecordDayGroup } from "@/features/home/types";
import {
  formatCurrency,
  formatShortDate,
  formatWeekdayName,
  isToday,
} from "@/features/home/utils";
import { RecordItem } from "./RecordItem";

interface RecordGroupProps {
  group: RecordDayGroup;
  referenceDate: string;
  categoriesById: Record<string, Category>;
  highlighted?: boolean;
  swipeEnabled?: boolean;
  onQuickSettle?: (record: FinancialRecord) => Promise<void>;
}

export function RecordGroup({
  group,
  referenceDate,
  categoriesById,
  highlighted = false,
  swipeEnabled,
  onQuickSettle,
}: RecordGroupProps) {
  const today = isToday(group.date, referenceDate);
  const showReceivableTotal = group.totalReceivable > 0;
  const showPayableTotal = group.totalPayable > 0;

  return (
    <section
      id={`record-group-${group.date}`}
      className={`overflow-hidden rounded-lg transition-colors duration-300 ${
        highlighted
          ? "border border-link bg-link-soft/70 ring-2 ring-link/40"
          : today
            ? "border border-link/40"
            : undefined
      }`}
    >
      <header className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              today ? "text-link" : "text-text-secondary"
            }`}
          >
            {formatShortDate(group.date)}
            <span className="ml-1.5 font-medium normal-case tracking-normal">
              {formatWeekdayName(group.date)}
            </span>
          </span>
          {today ? (
            <span className="rounded-full bg-link-soft px-2 py-0.5 text-[10px] font-medium text-link">
              Hoje
            </span>
          ) : null}
        </div>

        {showReceivableTotal || showPayableTotal ? (
          <div className="flex shrink-0 items-center gap-2">
            {showReceivableTotal ? (
              <span className="text-xs font-medium tabular-nums text-income">
                +{formatCurrency(group.totalReceivable)}
              </span>
            ) : null}
            {showPayableTotal ? (
              <span className="text-xs font-medium tabular-nums text-expense">
                -{formatCurrency(group.totalPayable)}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="divide-y divide-border/60">
        {group.records.map((record) => (
          <RecordItem
            key={record.id}
            record={record}
            category={categoriesById[record.categoryId]}
            referenceDate={referenceDate}
            swipeEnabled={swipeEnabled}
            onQuickSettle={onQuickSettle}
          />
        ))}
      </div>
    </section>
  );
}
