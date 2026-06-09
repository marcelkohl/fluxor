import type { ReactNode } from "react";
import type { SelectedMonth } from "@/features/home/types";
import { ThemeIcon } from "@/config/theme";
import { formatMonthYear } from "@/features/home/utils";

interface MonthNavigatorProps {
  selectedMonth: SelectedMonth;
  activeFilterCount?: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenExport: () => void;
  onOpenFilters: () => void;
}

export function MonthNavigator({
  selectedMonth,
  activeFilterCount = 0,
  onPreviousMonth,
  onNextMonth,
  onOpenExport,
  onOpenFilters,
}: MonthNavigatorProps) {
  const label = formatMonthYear(
    selectedMonth.year,
    selectedMonth.month,
  );

  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <NavButton label="Mês anterior" onClick={onPreviousMonth}>
        <ThemeIcon name="chevronLeft" />
      </NavButton>

      <span className="flex-1 truncate text-center text-sm font-medium text-text-primary">
        {label}
      </span>

      <div className="flex items-center">
        <NavButton label="Próximo mês" onClick={onNextMonth}>
          <ThemeIcon name="chevronRight" />
        </NavButton>
        <NavButton label="Gerar relatório" onClick={onOpenExport}>
          <ThemeIcon name="report" />
        </NavButton>
        <NavButton label="Filtros adicionais" onClick={onOpenFilters}>
          <span className="relative">
            <ThemeIcon name="filters" />
            {activeFilterCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-background">
                {activeFilterCount}
              </span>
            ) : null}
          </span>
        </NavButton>
      </div>
    </div>
  );
}

interface NavButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function NavButton({ label, disabled, onClick, children }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
    >
      {children}
    </button>
  );
}
