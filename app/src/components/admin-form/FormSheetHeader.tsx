interface FormSheetHeaderProps {
  title: string;
  titleId?: string;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  isSaving?: boolean;
  saveLabel?: string;
}

export function FormSheetHeader({
  title,
  titleId,
  onCancel,
  onSave,
  saveDisabled = false,
  isSaving = false,
  saveLabel = "Salvar",
}: FormSheetHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancelar
      </button>

      <h2
        id={titleId}
        className="truncate text-base font-semibold text-text-primary"
      >
        {title}
      </h2>

      <button
        type="button"
        disabled={saveDisabled || isSaving}
        onClick={onSave}
        className="shrink-0 text-sm font-medium text-link transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {isSaving ? "Salvando..." : saveLabel}
      </button>
    </header>
  );
}
