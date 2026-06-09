import { defaultEntityColor } from "@/config/theme";

import {
  MAX_CATEGORY_BARS,
  type CategoryBarItem,
  type CategoryBarsData,
} from "./category-bars.types";

interface CategoryBarRecord {
  categoryId: string;
  status: string;
  amount: number;
}

interface CategoryLookup {
  name: string;
  color: string;
}

function isCanceled(record: { status: string }): boolean {
  return record.status === "canceled";
}

export function calculateCategoryBarsFromRecords(
  records: CategoryBarRecord[],
  categoriesById: Record<string, CategoryLookup>,
): CategoryBarsData {
  const totalsByCategory = new Map<string, number>();

  for (const record of records) {
    if (isCanceled(record)) {
      continue;
    }

    const currentTotal = totalsByCategory.get(record.categoryId) ?? 0;
    totalsByCategory.set(
      record.categoryId,
      currentTotal + Math.abs(record.amount),
    );
  }

  const items: CategoryBarItem[] = Array.from(totalsByCategory.entries())
    .map(([categoryId, totalAmount]) => {
      const category = categoriesById[categoryId];

      return {
        categoryId,
        categoryName: category?.name ?? "Sem categoria",
        categoryColor: category?.color ?? defaultEntityColor,
        totalAmount,
      };
    })
    .sort((left, right) => right.totalAmount - left.totalAmount)
    .slice(0, MAX_CATEGORY_BARS);

  return {
    items,
    maxAmount: items[0]?.totalAmount ?? 0,
  };
}
