import { FormSheetHeader } from "@/components/admin-form/FormSheetHeader";
import { FormSheetPanel } from "@/components/admin-form/FormSheetPanel";
import { SheetScaffold } from "@/components/admin-form/SheetScaffold";

import type { HomeExportFormat } from "../types";

interface HomeExportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: HomeExportFormat) => void;
}

const exportOptions: Array<{ format: HomeExportFormat; label: string }> = [
  { format: "pdf", label: "Exportar PDF" },
  { format: "csv", label: "Exportar CSV" },
];

export function HomeExportSheet({
  isOpen,
  onClose,
  onExport,
}: HomeExportSheetProps) {
  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="home-export-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title="Exportar"
          titleId="home-export-title"
          onCancel={onClose}
          onSave={onClose}
          saveLabel="Concluir"
        />

        <div className="divide-y divide-border/50 px-4">
          {exportOptions.map((option) => (
            <button
              key={option.format}
              type="button"
              onClick={() => {
                onExport(option.format);
                onClose();
              }}
              className="flex w-full items-center py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft/60"
            >
              {option.label}
            </button>
          ))}
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
