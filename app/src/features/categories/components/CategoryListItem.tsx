import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { ThemeEntityAvatar } from "@/components/admin-form";
import type { Category } from "@/features/categories/domain";

interface CategoryListItemProps {
  category: Category;
  onClick: () => void;
}

export function CategoryListItem({ category, onClick }: CategoryListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-surface-soft active:bg-surface-soft"
    >
      <ThemeEntityAvatar
        icon={category.icon as ThemeIconName}
        color={category.color}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">
          {category.name}
        </span>
        {category.description ? (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">
            {category.description}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted">Sem descrição</span>
        )}
      </span>

      <ThemeIcon
        name="chevronRight"
        size="sm"
        className="shrink-0 text-text-secondary"
      />
    </button>
  );
}
