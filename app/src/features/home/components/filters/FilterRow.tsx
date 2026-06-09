interface FilterRowProps {
  label: string;
  value: string;
  onClick: () => void;
  onClear?: () => void;
}

export function FilterRow({ label, value, onClick, onClear }: FilterRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left transition-colors hover:opacity-80"
      >
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="truncate text-right text-sm font-medium text-text-primary">
          {value}
        </span>
      </button>

      {onClear ? (
        <button
          type="button"
          aria-label={`Limpar ${label.toLowerCase()}`}
          onClick={onClear}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-link transition-opacity hover:opacity-80"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}
