interface FilterFooterProps {
  onApply: () => void;
  onClear: () => void;
}

export function FilterFooter({ onApply, onClear }: FilterFooterProps) {
  return (
    <footer className="flex gap-2 border-t border-border px-4 py-3">
      <button
        type="button"
        onClick={onClear}
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft"
      >
        Limpar filtros
      </button>
      <button
        type="button"
        onClick={onApply}
        className="flex-1 rounded-lg bg-action-gradient px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Aplicar filtros
      </button>
    </footer>
  );
}
