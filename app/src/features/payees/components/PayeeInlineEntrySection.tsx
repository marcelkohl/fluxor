import { ThemeIcon } from "@/config/theme";

export interface EditableEntryRow {
  rowId: string;
  type: string;
  value: string;
}

interface PayeeInlineEntrySectionProps {
  title: string;
  rows: EditableEntryRow[];
  addLabel: string;
  typePlaceholder?: string;
  valuePlaceholder?: string;
  removeLabel: string;
  onChange: (rows: EditableEntryRow[]) => void;
}

export function createEditableEntryRow(): EditableEntryRow {
  return {
    rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: "",
    value: "",
  };
}

export function PayeeInlineEntrySection({
  title,
  rows,
  addLabel,
  typePlaceholder = "Tipo",
  valuePlaceholder = "Valor",
  removeLabel,
  onChange,
}: PayeeInlineEntrySectionProps) {
  function updateRow(rowId: string, patch: Partial<EditableEntryRow>) {
    onChange(
      rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(rowId: string) {
    onChange(rows.filter((row) => row.rowId !== rowId));
  }

  function addRow() {
    onChange([...rows, createEditableEntryRow()]);
  }

  return (
    <div className="px-4">
      <h3 className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h3>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_2rem] gap-2 border-b border-border/60 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <span>Tipo</span>
              <span>Valor</span>
              <span className="sr-only">Remover</span>
            </div>

            <div className="divide-y divide-border/40">
              {rows.map((row) => (
                <div
                  key={row.rowId}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_2rem] items-center gap-2 py-2"
                >
                  <input
                    type="text"
                    value={row.type}
                    placeholder={typePlaceholder}
                    onChange={(event) =>
                      updateRow(row.rowId, { type: event.target.value })
                    }
                    className="min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-primary placeholder:text-muted outline-none focus:border-link"
                    aria-label={`${title} tipo`}
                  />
                  <input
                    type="text"
                    value={row.value}
                    placeholder={valuePlaceholder}
                    onChange={(event) =>
                      updateRow(row.rowId, { value: event.target.value })
                    }
                    className="min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-primary placeholder:text-muted outline-none focus:border-link"
                    aria-label={`${title} valor`}
                  />
                  <button
                    type="button"
                    aria-label={removeLabel}
                    onClick={() => removeRow(row.rowId)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-expense"
                  >
                    <ThemeIcon name="close" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={addRow}
        className="mt-2 py-2 text-sm font-medium text-link transition-opacity hover:opacity-80"
      >
        {addLabel}
      </button>
    </div>
  );
}
