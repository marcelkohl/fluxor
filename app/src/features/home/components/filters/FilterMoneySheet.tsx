import { useEffect, useState } from "react";

import { FormInputRow } from "@/components/admin-form/FormInputRow";
import { FormSheetHeader } from "@/components/admin-form/FormSheetHeader";
import { FormSheetPanel } from "@/components/admin-form/FormSheetPanel";
import { SheetScaffold } from "@/components/admin-form/SheetScaffold";
import {
  formatCentsInputPreview,
  parseExpectedAmountToCents,
} from "@/features/financial-records/utils/parse-expected-amount";

interface FilterMoneySheetProps {
  isOpen: boolean;
  title: string;
  valueCents: number | null;
  onSave: (valueCents: number | null) => void;
  onClose: () => void;
}

export function FilterMoneySheet({
  isOpen,
  title,
  valueCents,
  onSave,
  onClose,
}: FilterMoneySheetProps) {
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setInput(valueCents != null ? formatCentsInputPreview(valueCents) : "");
  }, [isOpen, valueCents]);

  function handleSave() {
    const trimmed = input.trim();
    if (!trimmed) {
      onSave(null);
      onClose();
      return;
    }

    const cents = parseExpectedAmountToCents(trimmed);
    if (cents == null) {
      return;
    }

    onSave(cents);
    onClose();
  }

  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="filter-money-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <FormSheetPanel>
        <FormSheetHeader
          title={title}
          titleId="filter-money-title"
          onCancel={onClose}
          onSave={handleSave}
          saveDisabled={input.trim().length > 0 && parseExpectedAmountToCents(input) == null}
        />

        <div className="px-4 py-2">
          <FormInputRow
            label="Valor"
            value={input}
            placeholder="0,00"
            onChange={setInput}
          />
          <p className="pb-3 text-xs text-text-secondary">
            Deixe vazio para remover o filtro.
          </p>
        </div>
      </FormSheetPanel>
    </SheetScaffold>
  );
}
