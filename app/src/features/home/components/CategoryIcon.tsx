import type { Category } from "@/features/home/types";
import {
  ThemeIcon,
  resolveCategoryIconAsset,
  shouldUseCategoryAsset,
} from "@/config/theme";

interface CategoryIconProps {
  category: Category;
}

export function CategoryIcon({ category }: CategoryIconProps) {
  const categoryKey = category.icon.replace("category", "").toLowerCase();
  const useAsset = shouldUseCategoryAsset(categoryKey);

  if (useAsset) {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: `${category.color}22` }}
        aria-hidden
      >
        <img
          src={resolveCategoryIconAsset(categoryKey)}
          alt=""
          className="h-5 w-5 object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${category.color}22`, color: category.color }}
      aria-hidden
    >
      <ThemeIcon name={category.icon} size="sm" />
    </span>
  );
}
