export interface CategoryBarItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalAmount: number;
}

export interface CategoryBarsData {
  items: CategoryBarItem[];
  maxAmount: number;
}

export const MAX_CATEGORY_BARS = 6;
