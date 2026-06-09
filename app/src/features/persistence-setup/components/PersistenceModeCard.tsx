interface PersistenceModeCardProps {
  title: string;
  description: string;
  selected?: boolean;
  onSelect: () => void;
}

export function PersistenceModeCard({
  title,
  description,
  selected = false,
  onSelect,
}: PersistenceModeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-link bg-link-soft"
          : "border-border bg-surface hover:bg-surface-soft"
      }`}
    >
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
        {description}
      </p>
    </button>
  );
}
