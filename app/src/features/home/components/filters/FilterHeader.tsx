import { ThemeIcon } from "@/config/theme";

interface FilterHeaderProps {
  onClose: () => void;
  onClear: () => void;
}

export function FilterHeader({ onClose, onClear }: FilterHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <button
        type="button"
        aria-label="Fechar filtros"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
      >
        <ThemeIcon name="close" size="sm" />
      </button>

      <h2
        id="home-filters-title"
        className="text-base font-semibold text-text-primary"
      >
        Filtros
      </h2>

      <button
        type="button"
        onClick={onClear}
        className="shrink-0 text-sm font-medium text-link transition-opacity hover:opacity-80"
      >
        Limpar
      </button>
    </header>
  );
}
