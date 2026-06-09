import { ThemeIcon, type ThemeIconName } from "@/config/theme";

import { FormSheetHeader } from "./FormSheetHeader";
import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

interface IconPickerSheetProps {
  isOpen: boolean;
  title?: string;
  selected: ThemeIconName;
  options: readonly ThemeIconName[];
  getLabel?: (icon: ThemeIconName) => string;
  onSelect: (icon: ThemeIconName) => void;
  onClose: () => void;
}

function defaultIconLabel(icon: ThemeIconName): string {
  return icon
    .replace(/^category/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function IconPickerSheet({
  isOpen,
  title = "Selecionar ícone",
  selected,
  options,
  getLabel = defaultIconLabel,
  onSelect,
  onClose,
}: IconPickerSheetProps) {
  const sortedOptions = [...options].sort((a, b) =>
    getLabel(a).localeCompare(getLabel(b), "pt-BR", { sensitivity: "base" }),
  );

  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="icon-picker-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="icon-picker-title"
          onCancel={onClose}
          onSave={onClose}
          saveLabel="Concluir"
          saveDisabled={false}
        />

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/50 px-4">
          {sortedOptions.map((iconName) => {
            const isSelected = selected === iconName;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onSelect(iconName);
                  onClose();
                }}
                className={`flex w-full items-center justify-between gap-3 py-3 text-left transition-colors ${
                  isSelected ? "text-link" : "hover:bg-surface-soft/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-link-soft text-link"
                        : "bg-surface-soft text-text-secondary"
                    }`}
                  >
                    <ThemeIcon name={iconName} size="sm" />
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {getLabel(iconName)}
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
