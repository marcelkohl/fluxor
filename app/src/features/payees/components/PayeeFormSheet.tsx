import { useEffect, useState } from "react";

import {
  FormFieldRow,
  FormInputRow,
  FormSheetHeader,
  FormSheetPanel,
  SheetScaffold,
  TextEditorSheet,
} from "@/components/admin-form";
import {
  ValidationError,
  NotFoundError,
  DatabaseNotReadyError,
} from "@/features/database";
import {
  archivePayee,
  createPayee,
  createPayeeDocument,
  createPayeePaymentMethod,
  listPayeeDocuments,
  listPayeePaymentMethods,
  removePayeeDocument,
  removePayeePaymentMethod,
  updatePayee,
} from "@/features/payees/application";
import {
  PayeeInlineEntrySection,
  type EditableEntryRow,
} from "@/features/payees/components/PayeeInlineEntrySection";
import { normalizeEntryRows } from "@/features/payees/utils/payee-entry-rows";
import type { Payee } from "@/features/payees/domain";

export interface PayeeFormSheetProps {
  isOpen: boolean;
  mode: "create" | "edit";
  payee: Payee | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

interface PayeeFormState {
  name: string;
  notes: string;
}

type ActivePicker = "notes" | null;

function summarizeText(text: string, maxLength = 32): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Sem observação";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível salvar o favorecido.";
}

function logPayeeError(context: string, error: unknown): void {
  console.error(`[PayeeFormSheet] ${context}`, error);
}

function buildInitialState(payee: Payee | null): PayeeFormState {
  if (payee) {
    return {
      name: payee.name,
      notes: payee.notes ?? "",
    };
  }

  return {
    name: "",
    notes: "",
  };
}

function mapToEditableRows(
  items: Array<{ id: string; type: string; value: string }>,
): EditableEntryRow[] {
  return items.map((item) => ({
    rowId: item.id,
    type: item.type,
    value: item.value,
  }));
}

export function PayeeFormSheet({
  isOpen,
  mode,
  payee,
  onClose,
  onSaved,
}: PayeeFormSheetProps) {
  const [form, setForm] = useState<PayeeFormState>(() =>
    buildInitialState(payee),
  );
  const [documentRows, setDocumentRows] = useState<EditableEntryRow[]>([]);
  const [paymentMethodRows, setPaymentMethodRows] = useState<EditableEntryRow[]>(
    [],
  );
  const [originalDocumentIds, setOriginalDocumentIds] = useState<string[]>([]);
  const [originalPaymentMethodIds, setOriginalPaymentMethodIds] = useState<
    string[]
  >([]);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async (payeeId: string) => {
    setIsLoadingDetails(true);
    try {
      const [loadedDocuments, loadedPaymentMethods] = await Promise.all([
        listPayeeDocuments(payeeId),
        listPayeePaymentMethods(payeeId),
      ]);

      setDocumentRows(mapToEditableRows(loadedDocuments));
      setPaymentMethodRows(mapToEditableRows(loadedPaymentMethods));
      setOriginalDocumentIds(loadedDocuments.map((document) => document.id));
      setOriginalPaymentMethodIds(
        loadedPaymentMethods.map((method) => method.id),
      );
    } catch (loadError) {
      logPayeeError("Falha ao carregar detalhes do favorecido", loadError);
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState(payee));
      setActivePicker(null);
      setError(null);
      setShowArchiveConfirm(false);
      setDocumentRows([]);
      setPaymentMethodRows([]);
      setOriginalDocumentIds([]);
      setOriginalPaymentMethodIds([]);

      if (mode === "edit" && payee) {
        void loadDetails(payee.id);
      }
    }
  }, [isOpen, mode, payee]);

  if (!isOpen) {
    return null;
  }

  const title = mode === "create" ? "Novo favorecido" : "Editar favorecido";
  const isEditMode = mode === "edit" && payee !== null;

  async function syncDocuments(payeeId: string, rows: EditableEntryRow[]) {
    for (const documentId of originalDocumentIds) {
      await removePayeeDocument(documentId);
    }

    for (const row of rows) {
      await createPayeeDocument({
        payeeId,
        type: row.type,
        value: row.value,
      });
    }
  }

  async function syncPaymentMethods(
    payeeId: string,
    rows: EditableEntryRow[],
  ) {
    for (const methodId of originalPaymentMethodIds) {
      await removePayeePaymentMethod(methodId);
    }

    for (const row of rows) {
      await createPayeePaymentMethod({
        payeeId,
        type: row.type,
        value: row.value,
      });
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const documentsResult = normalizeEntryRows(documentRows, "Documentos");
    if (documentsResult.error) {
      setError(documentsResult.error);
      setIsSaving(false);
      return;
    }

    const paymentMethodsResult = normalizeEntryRows(
      paymentMethodRows,
      "Formas de pagamento",
    );
    if (paymentMethodsResult.error) {
      setError(paymentMethodsResult.error);
      setIsSaving(false);
      return;
    }

    try {
      const trimmedName = form.name.trim();
      const notes = form.notes.trim() ? form.notes.trim() : null;

      if (mode === "create") {
        const created = await createPayee({ name: trimmedName, notes });
        await syncDocuments(created.id, documentsResult.rows);
        await syncPaymentMethods(created.id, paymentMethodsResult.rows);
      } else if (payee) {
        await updatePayee({
          payeeId: payee.id,
          name: trimmedName,
          notes,
        });
        await syncDocuments(payee.id, documentsResult.rows);
        await syncPaymentMethods(payee.id, paymentMethodsResult.rows);
      } else {
        return;
      }

      await onSaved();
      onClose();
    } catch (saveError) {
      logPayeeError("Falha ao salvar favorecido", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!payee) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await archivePayee(payee.id);
      await onSaved();
      onClose();
    } catch (archiveError) {
      logPayeeError("Falha ao arquivar favorecido", archiveError);
      setError(getErrorMessage(archiveError));
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  }

  const archiveFooter =
    isEditMode && payee ? (
      <footer className="border-t border-border px-4 py-3">
        {showArchiveConfirm ? (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Arquivar &ldquo;{payee.name}&rdquo;? O favorecido deixa de
              aparecer nas telas operacionais, mas os dados permanecem salvos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => void handleArchive()}
                className="flex-1 rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm font-medium text-expense transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isArchiving ? "Arquivando..." : "Confirmar"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="w-full py-2 text-sm font-medium text-expense transition-opacity hover:opacity-80"
          >
            Arquivar favorecido
          </button>
        )}
      </footer>
    ) : null;

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        titleId="payee-form-title"
        onClose={onClose}
      >
        <FormSheetPanel footer={archiveFooter}>
          <FormSheetHeader
            title={title}
            titleId="payee-form-title"
            onCancel={onClose}
            onSave={() => void handleSave()}
            saveDisabled={!form.name.trim()}
            isSaving={isSaving}
          />

          <div className="max-h-[65vh] overflow-y-auto">
            <div className="divide-y divide-border/50 px-4">
              <FormInputRow
                label="Nome"
                value={form.name}
                placeholder="Ex.: Empresa XYZ"
                onChange={(name) => setForm((current) => ({ ...current, name }))}
              />

              <FormFieldRow
                label="Observação"
                value={summarizeText(form.notes)}
                onClick={() => setActivePicker("notes")}
              />
            </div>

            {isLoadingDetails && isEditMode ? (
              <p className="px-4 py-3 text-xs text-text-secondary">
                Carregando documentos e formas de pagamento...
              </p>
            ) : (
              <>
                <PayeeInlineEntrySection
                  title="Documentos"
                  rows={documentRows}
                  addLabel="+ Adicionar documento"
                  typePlaceholder="CPF, RG, Passaporte..."
                  valuePlaceholder="123.456.789-00"
                  removeLabel="Remover documento"
                  onChange={setDocumentRows}
                />

                <PayeeInlineEntrySection
                  title="Formas de pagamento"
                  rows={paymentMethodRows}
                  addLabel="+ Adicionar forma de pagamento"
                  typePlaceholder="PIX, Banco, Wise..."
                  valuePlaceholder="joao@email.com"
                  removeLabel="Remover forma de pagamento"
                  onChange={setPaymentMethodRows}
                />
              </>
            )}

            {error ? (
              <p className="mx-4 mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
                {error}
              </p>
            ) : null}
          </div>
        </FormSheetPanel>
      </SheetScaffold>

      <TextEditorSheet
        isOpen={activePicker === "notes"}
        title="Observação"
        value={form.notes}
        placeholder="Observações opcionais sobre o favorecido"
        onSave={(notes) => setForm((current) => ({ ...current, notes }))}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
