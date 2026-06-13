import type { RecurrenceScope } from "@fluxor/contracts";

import { FormSheetPanel, SheetScaffold } from "@/components/admin-form";

const SCOPE_OPTIONS: readonly RecurrenceScope[] = [
  "this_only",
  "this_and_future",
];

const SCOPE_LABELS: Record<RecurrenceScope, string> = {
  this_only: "Apenas esta ocorrência",
  this_and_future: "Esta e próximas ocorrências",
};

interface RecurrenceScopeSheetProps {
  isOpen: boolean;
  title: string;
  onSelect: (scope: RecurrenceScope) => void;
  onClose: () => void;
}

export function RecurrenceScopeSheet({
  isOpen,
  title,
  onSelect,
  onClose,
}: RecurrenceScopeSheetProps) {
  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="recurrence-scope-title"
      zIndexClass="z-[70]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancelar
          </button>
          <h2
            id="recurrence-scope-title"
            className="truncate text-base font-semibold text-text-primary"
          >
            {title}
          </h2>
          <span className="w-16 shrink-0" aria-hidden />
        </header>

        <div className="divide-y divide-border/60 px-4 pb-4">
          {SCOPE_OPTIONS.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => onSelect(scope)}
              className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-text-primary transition-colors hover:text-link"
            >
              {SCOPE_LABELS[scope]}
            </button>
          ))}
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
