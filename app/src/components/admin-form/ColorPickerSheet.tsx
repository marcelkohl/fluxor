import { FormSheetHeader } from "./FormSheetHeader";
import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

interface ColorPickerSheetProps {
  isOpen: boolean;
  title?: string;
  selected: string;
  options: readonly string[];
  getLabel?: (color: string) => string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

function defaultColorLabel(color: string): string {
  return color;
}

export function ColorPickerSheet({
  isOpen,
  title = "Selecionar cor",
  selected,
  options,
  getLabel = defaultColorLabel,
  onSelect,
  onClose,
}: ColorPickerSheetProps) {
  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="color-picker-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="color-picker-title"
          onCancel={onClose}
          onSave={onClose}
          saveLabel="Concluir"
          saveDisabled={false}
        />

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/50 px-4">
          {options.map((color) => {
            const isSelected = selected === color;

            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onSelect(color);
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-surface-soft/60"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {getLabel(color)}
                  </span>
                </span>
                {isSelected ? (
                  <span className="text-xs font-medium text-link">Atual</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
