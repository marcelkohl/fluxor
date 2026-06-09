import { formatCurrency } from "@/features/home/utils";
import type { WidgetProps } from "@/features/widgets/types";

import { calculateCategoryBarsFromRecords } from "./category-bars.calculations";
import type { CategoryBarItem } from "./category-bars.types";

const MIN_VISIBLE_BAR_PERCENT = 4;

export function CategoryBarsWidget({ context }: WidgetProps) {
  const chart = calculateCategoryBarsFromRecords(
    context.records,
    context.categoriesById,
  );

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
        Valores por Categoria
      </h2>

      {chart.items.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center">
          <p className="text-xs text-text-secondary">
            Sem dados por categoria neste período
          </p>
        </div>
      ) : (
        <div className="mt-2 flex min-h-0 flex-1 gap-1">
          {chart.items.map((item) => (
            <CategoryBarColumn
              key={item.categoryId}
              item={item}
              maxAmount={chart.maxAmount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryBarColumnProps {
  item: CategoryBarItem;
  maxAmount: number;
}

function CategoryBarColumn({ item, maxAmount }: CategoryBarColumnProps) {
  const barHeightPercent =
    maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0;
  const visibleBarHeightPercent =
    item.totalAmount > 0
      ? Math.max(barHeightPercent, MIN_VISIBLE_BAR_PERCENT)
      : 0;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center">
      <p className="shrink-0 text-[7px] font-medium tabular-nums leading-none text-text-primary">
        {formatCurrency(item.totalAmount)}
      </p>

      <div className="relative mt-1 min-h-0 w-full flex-1">
        <div className="absolute inset-0 flex items-end justify-center">
          {visibleBarHeightPercent > 0 ? (
            <div
              aria-hidden="true"
              className="w-7 rounded-t-md"
              style={{
                height: `${visibleBarHeightPercent}%`,
                backgroundColor: item.categoryColor,
              }}
            />
          ) : null}
        </div>
      </div>

      <p
        className="mt-1 max-w-[2.75rem] shrink-0 truncate text-center text-[6px] leading-none text-text-secondary"
        title={item.categoryName}
      >
        {item.categoryName}
      </p>
    </div>
  );
}
