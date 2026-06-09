import { useEffect, useState } from "react";

import {
  DatePickerSheet,
  FormFieldRow,
  FormInputRow,
  FormSheetHeader,
  FormSheetPanel,
  formatIsoDatePtBr,
  SheetScaffold,
  TextEditorSheet,
} from "@/components/admin-form";
import type { FinancialRecordType } from "@/features/financial-records/domain";
import {
  formatCentsInputPreview,
  parseExpectedAmountToCents,
} from "@/features/financial-records/utils/parse-expected-amount";
import { todayIsoDate } from "@/features/home/utils/domain-record-to-home-record";

type ActivePicker = "date" | "note" | null;

interface RegisterPaymentSheetProps {
  isOpen: boolean;
  recordType: FinancialRecordType;
  expectedAmountCents: number;
  onConfirm: (input: {
    effectiveDate: string;
    effectiveAmount: number;
    paymentNote: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

function summarizeText(text: string, maxLength = 28): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Nenhuma";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

export function RegisterPaymentSheet({
  isOpen,
  recordType,
  expectedAmountCents,
  onConfirm,
  onClose,
}: RegisterPaymentSheetProps) {
  const title =
    recordType === "payable" ? "Registrar pagamento" : "Registrar recebimento";

  const [effectiveDate, setEffectiveDate] = useState(todayIsoDate);
  const [amountInput, setAmountInput] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEffectiveDate(todayIsoDate());
    setAmountInput(formatCentsInputPreview(expectedAmountCents));
    setPaymentNote("");
    setActivePicker(null);
    setError(null);
  }, [expectedAmountCents, isOpen]);

  const parsedAmount = parseExpectedAmountToCents(amountInput);
  const canSave = parsedAmount != null && effectiveDate.trim().length > 0;

  async function handleSave() {
    if (parsedAmount == null) {
      setError("Informe um valor efetivo válido");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onConfirm({
        effectiveDate,
        effectiveAmount: parsedAmount,
        paymentNote: paymentNote.trim() ? paymentNote.trim() : null,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível registrar a efetivação",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        titleId="register-payment-title"
        zIndexClass="z-[60]"
        onClose={onClose}
      >
        <FormSheetPanel>
          <FormSheetHeader
            title={title}
            titleId="register-payment-title"
            onCancel={onClose}
            onSave={() => void handleSave()}
            saveDisabled={!canSave}
            isSaving={isSaving}
            saveLabel="Confirmar"
          />

          <div className="overflow-y-auto px-4 py-2">
            {error ? (
              <p className="mb-3 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
                {error}
              </p>
            ) : null}

            <div className="divide-y divide-border/60 rounded-xl border border-border bg-background">
              <FormFieldRow
                label="Data efetiva"
                value={formatIsoDatePtBr(effectiveDate)}
                onClick={() => setActivePicker("date")}
              />
              <FormInputRow
                label="Valor efetivo"
                value={amountInput}
                placeholder="0,00"
                onChange={setAmountInput}
              />
              <FormFieldRow
                label="Observação"
                value={summarizeText(paymentNote)}
                onClick={() => setActivePicker("note")}
              />
            </div>
          </div>
        </FormSheetPanel>
      </SheetScaffold>

      <DatePickerSheet
        isOpen={isOpen && activePicker === "date"}
        value={effectiveDate}
        onSave={setEffectiveDate}
        onClose={() => setActivePicker(null)}
      />

      <TextEditorSheet
        isOpen={isOpen && activePicker === "note"}
        title="Observação da efetivação"
        value={paymentNote}
        placeholder="Opcional"
        onSave={setPaymentNote}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
