import { useEffect, useState } from "react";

import { FormInputRow } from "./FormInputRow";
import { FormSheetHeader } from "./FormSheetHeader";
import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

interface TypeValueFormSheetProps {
  isOpen: boolean;
  title: string;
  typeLabel: string;
  valueLabel: string;
  typePlaceholder?: string;
  valuePlaceholder?: string;
  onSave: (type: string, value: string) => void | Promise<void>;
  onClose: () => void;
}

export function TypeValueFormSheet({
  isOpen,
  title,
  typeLabel,
  valueLabel,
  typePlaceholder,
  valuePlaceholder,
  onSave,
  onClose,
}: TypeValueFormSheetProps) {
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType("");
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSave() {
    const trimmedType = type.trim();
    const trimmedValue = value.trim();

    setIsSaving(true);
    try {
      await onSave(trimmedType, trimmedValue);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="type-value-form-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="type-value-form-title"
          onCancel={onClose}
          onSave={() => void handleSave()}
          saveDisabled={!type.trim() || !value.trim()}
          isSaving={isSaving}
        />

        <div className="divide-y divide-border/50 px-4">
          <FormInputRow
            label={typeLabel}
            value={type}
            placeholder={typePlaceholder}
            onChange={setType}
          />
          <FormInputRow
            label={valueLabel}
            value={value}
            placeholder={valuePlaceholder}
            onChange={setValue}
          />
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
