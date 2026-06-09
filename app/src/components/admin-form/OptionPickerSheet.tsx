import type { ReactNode } from "react";

import { FormSheetHeader } from "./FormSheetHeader";
import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

export interface OptionPickerRenderContext {
  isSelected: boolean;
  label: string;
}

interface OptionPickerSheetProps {
  isOpen: boolean;
  title: string;
  selected: string;
  options: readonly string[];
  getLabel?: (option: string) => string;
  renderOption?: (option: string, context: OptionPickerRenderContext) => ReactNode;
  onSelect: (option: string) => void;
  onClose: () => void;
}

export function OptionPickerSheet({
  isOpen,
  title,
  selected,
  options,
  getLabel = (option) => option,
  renderOption,
  onSelect,
  onClose,
}: OptionPickerSheetProps) {
  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="option-picker-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="option-picker-title"
          onCancel={onClose}
          onSave={onClose}
          saveLabel="Concluir"
        />

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/50 px-4">
          {options.map((option) => {
            const isSelected = selected === option;
            const label = getLabel(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                className={`flex w-full items-center justify-between gap-3 py-3 text-left transition-colors ${
                  isSelected ? "text-link" : "hover:bg-surface-soft/60"
                }`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  {renderOption ? (
                    renderOption(option, { isSelected, label })
                  ) : (
                    <span className="text-sm font-medium text-text-primary">
                      {label}
                    </span>
                  )}
                </span>
                {isSelected ? (
                  <span className="shrink-0 text-xs font-medium text-link">
                    Atual
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
