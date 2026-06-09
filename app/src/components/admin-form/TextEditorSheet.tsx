import { useEffect, useState } from "react";

import { FormSheetHeader } from "./FormSheetHeader";
import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

interface TextEditorSheetProps {
  isOpen: boolean;
  title?: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function TextEditorSheet({
  isOpen,
  title = "Editar texto",
  value,
  placeholder,
  onSave,
  onClose,
}: TextEditorSheetProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
    }
  }, [isOpen, value]);

  function handleSave() {
    onSave(draft);
    onClose();
  }

  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="text-editor-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="text-editor-title"
          onCancel={onClose}
          onSave={handleSave}
          saveLabel="Salvar"
        />

        <div className="px-4 py-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-muted outline-none transition-colors focus:border-link"
            autoFocus
          />
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
