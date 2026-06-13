import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { RecurrenceRule } from "@fluxor/contracts";
import {
  DatePickerSheet,
  FormFieldRow,
  FormInputRow,
  formatIsoDatePtBr,
  OptionPickerSheet,
  TextEditorSheet,
  ThemeEntityAvatar,
} from "@/components/admin-form";
import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import {
  DatabaseNotReadyError,
  NotFoundError,
  ValidationError,
} from "@/features/database";
import {
  getActiveAccountId,
  useActiveAccountId,
} from "@/features/home/hooks/useActiveAccountId";
import { logRemoteDev } from "@/features/home/utils/dev-log";
import {
  isValidEntityId,
  shouldUseHomeMocks,
} from "@/features/home/utils/home-persistence";
import {
  createFinancialRecord,
  createRecurringFinancialRecords,
  getFinancialRecordById,
  getRecurrenceBatch,
  updateFinancialRecord,
} from "@/features/financial-records/application";
import { RecurrenceRuleSheet } from "@/features/financial-records/components/RecurrenceRuleSheet";
import { RecurrenceScopeSheet } from "@/features/financial-records/components/RecurrenceScopeSheet";
import type { FinancialRecord, FinancialRecordType } from "@/features/financial-records/domain";
import type { RecurrenceScope } from "@fluxor/contracts";
import { useCreateRecordCatalogs } from "@/features/financial-records/hooks/useCreateRecordCatalogs";
import { formatRecurrenceRuleSummary } from "@/features/financial-records/utils/format-recurrence-rule-summary";
import {
  formatCentsInputPreview,
  parseExpectedAmountToCents,
} from "@/features/financial-records/utils/parse-expected-amount";
import { ATTACH_UNSAVED_RECORD_MESSAGE } from "@/features/document-storage/types/attachment-operation-state";
import { getPersistenceConfig } from "@/features/persistence-setup";

const NONE_OPTION = "__none__";

const NO_ACTIVE_WALLET_MESSAGE =
  "Selecione uma carteira na Home antes de criar um registro.";

const COMPLETED_RECORD_MESSAGE =
  "Registros efetivados não podem ser editados nesta versão.";

const TRANSFER_RECORD_MESSAGE =
  "Registros de transferência não podem ser editados nesta etapa.";

const RECORD_TYPE_OPTIONS: readonly FinancialRecordType[] = [
  "payable",
  "receivable",
];

const RECORD_TYPE_LABELS: Record<FinancialRecordType, string> = {
  payable: "A pagar",
  receivable: "A receber",
};

type ActivePicker =
  | "type"
  | "dueDate"
  | "category"
  | "payee"
  | "notes"
  | "wallet"
  | null;

export type FinancialRecordFormMode = "create" | "edit";

export interface FinancialRecordFormPageProps {
  mode?: FinancialRecordFormMode;
  recordId?: string;
}

interface CreateRecordLocationState {
  walletId?: string;
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSaveErrorMessage(error: unknown): string {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof DatabaseNotReadyError
  ) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível salvar o registro";
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

function hasActiveWalletId(activeAccountId: string): boolean {
  if (!activeAccountId.trim()) {
    return false;
  }
  if (shouldUseHomeMocks()) {
    return true;
  }
  return isValidEntityId(activeAccountId);
}

function applyRecordToForm(
  record: FinancialRecord,
  setters: {
    setWalletId: (value: string) => void;
    setType: (value: FinancialRecordType) => void;
    setCategoryId: (value: string) => void;
    setPayeeId: (value: string | null) => void;
    setDescription: (value: string) => void;
    setDueDate: (value: string) => void;
    setExpectedAmountInput: (value: string) => void;
    setRecordNote: (value: string) => void;
  },
): void {
  setters.setWalletId(record.walletId);
  setters.setType(record.type);
  setters.setCategoryId(record.categoryId);
  setters.setPayeeId(record.payeeId);
  setters.setDescription(record.description);
  setters.setDueDate(record.dueDate);
  setters.setExpectedAmountInput(formatCentsInputPreview(record.expectedAmount));
  setters.setRecordNote(record.recordNote ?? "");
}

export function FinancialRecordFormPage({
  mode = "create",
  recordId,
}: FinancialRecordFormPageProps) {
  const isEditMode = mode === "edit";
  const navigate = useNavigate();
  const location = useLocation();
  const navigationWalletId = (location.state as CreateRecordLocationState | null)
    ?.walletId;

  const { categories, payees, wallets, isLoading, error: loadError } =
    useCreateRecordCatalogs();

  const activeAccountIdFromStore = useActiveAccountId();

  const activeAccountId = useMemo(() => {
    const storeId = activeAccountIdFromStore.trim();
    if (storeId && isValidEntityId(storeId)) {
      return storeId;
    }
    const navId = navigationWalletId?.trim();
    if (navId && isValidEntityId(navId)) {
      return navId;
    }
    return storeId || navId || "";
  }, [activeAccountIdFromStore, navigationWalletId]);

  const [walletId, setWalletId] = useState("");
  const [type, setType] = useState<FinancialRecordType>("payable");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [payeeId, setPayeeId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayIsoDate);
  const [expectedAmountInput, setExpectedAmountInput] = useState("");
  const [recordNote, setRecordNote] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [recurrenceSheetOpen, setRecurrenceSheetOpen] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode);
  const [loadRecordError, setLoadRecordError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [recurrenceLabel, setRecurrenceLabel] = useState<string | null>(null);
  const [isRecordBlocked, setIsRecordBlocked] = useState(false);
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);

  const resolvedWalletId = walletId.trim() || activeAccountId.trim();
  const hasActiveWallet = isEditMode
    ? Boolean(walletId.trim())
    : hasActiveWalletId(activeAccountId);

  const categoryById = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category]),
      ),
    [categories],
  );

  const payeeNameById = useMemo(
    () => Object.fromEntries(payees.map((payee) => [payee.id, payee.name])),
    [payees],
  );

  const walletNameById = useMemo(
    () => Object.fromEntries(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );

  const isRecurringRecord = Boolean(editingRecord?.recurrenceGroupId);

  const recurrenceSummary = recurrenceRule
    ? formatRecurrenceRuleSummary(recurrenceRule, dueDate)
    : "Não repetir";

  useEffect(() => {
    if (!isEditMode || !recordId?.trim()) {
      return;
    }

    let cancelled = false;

    async function loadRecord() {
      setIsLoadingRecord(true);
      setLoadRecordError(null);
      setIsRecordBlocked(false);
      setEditingRecord(null);

      try {
        const record = await getFinancialRecordById(recordId!.trim());

        if (cancelled) {
          return;
        }

        if (record.transferGroupId) {
          setIsRecordBlocked(true);
          setLoadRecordError(TRANSFER_RECORD_MESSAGE);
          return;
        }

        if (record.storedStatus === "completed") {
          setIsRecordBlocked(true);
          setLoadRecordError(COMPLETED_RECORD_MESSAGE);
          return;
        }

        setEditingRecord(record);
        applyRecordToForm(record, {
          setWalletId,
          setType,
          setCategoryId,
          setPayeeId,
          setDescription,
          setDueDate,
          setExpectedAmountInput,
          setRecordNote,
        });

        if (
          record.recurrenceGroupId &&
          record.recurrenceIndex != null
        ) {
          try {
            const batch = await getRecurrenceBatch(record.recurrenceGroupId);
            setRecurrenceLabel(
              `${record.recurrenceIndex}/${batch.occurrenceCount}`,
            );
          } catch {
            setRecurrenceLabel(`${record.recurrenceIndex}/?`);
          }
        } else {
          setRecurrenceLabel(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadRecordError(getSaveErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecord(false);
        }
      }
    }

    void loadRecord();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, recordId]);

  const canSave =
    !isLoading &&
    !isLoadingRecord &&
    !isRecordBlocked &&
    !isSaving &&
    hasActiveWallet &&
    Boolean(categoryId) &&
    description.trim().length > 0 &&
    dueDate.trim().length > 0 &&
    expectedAmountInput.trim().length > 0;

  async function performSave(scope?: RecurrenceScope) {
    setSaveError(null);

    if (isRecordBlocked) {
      return;
    }

    if (!hasActiveWallet) {
      setSaveError(
        isEditMode
          ? "Selecione uma carteira"
          : NO_ACTIVE_WALLET_MESSAGE,
      );
      return;
    }

    const expectedAmount = parseExpectedAmountToCents(expectedAmountInput);
    if (expectedAmount == null) {
      setSaveError("Informe um valor previsto válido");
      return;
    }

    if (!categoryId) {
      setSaveError("Selecione uma categoria");
      return;
    }

    if (
      !shouldUseHomeMocks() &&
      !isValidEntityId(resolvedWalletId)
    ) {
      setSaveError("Carteira inválida. Selecione uma carteira válida.");
      return;
    }

    if (!shouldUseHomeMocks() && !isValidEntityId(categoryId)) {
      setSaveError("Categoria inválida.");
      return;
    }

    if (payeeId && !shouldUseHomeMocks() && !isValidEntityId(payeeId)) {
      setSaveError("Favorecido inválido.");
      return;
    }

    setIsSaving(true);

    const payload = {
      walletId: resolvedWalletId,
      type,
      description: description.trim(),
      categoryId,
      dueDate,
      expectedAmount,
      payeeId,
      recordNote: recordNote.trim() ? recordNote.trim() : null,
    };

    try {
      if (isEditMode) {
        if (!recordId?.trim()) {
          setSaveError("Registro inválido");
          return;
        }

        await updateFinancialRecord({
          recordId: recordId.trim(),
          scope,
          walletId: payload.walletId,
          type: payload.type,
          description: payload.description,
          categoryId: payload.categoryId,
          dueDate: payload.dueDate,
          expectedAmount: payload.expectedAmount,
          payeeId: payload.payeeId,
          recordNote: payload.recordNote,
        });

        navigate(`/records/${recordId.trim()}`, {
          replace: true,
          state: { toast: "Registro atualizado" },
        });
        return;
      }

      if (import.meta.env.DEV) {
        const config = getPersistenceConfig();
        const storeWalletId = getActiveAccountId().trim();
        logRemoteDev("[CreateRecord] active walletId", {
          storeWalletId,
          resolvedWalletId: payload.walletId,
          navigationWalletId,
          activeAccountIdFromStore,
        });
        logRemoteDev("[CreateRecord] payload.walletId", {
          provider: config?.mode ?? "unknown",
          remoteBaseUrl: config?.remoteBaseUrl,
          walletId: payload.walletId,
          categoryId: payload.categoryId,
          payeeId: payload.payeeId,
          endpoint: recurrenceRule
            ? "POST /api/v1/financial-records/recurring"
            : "POST /api/v1/financial-records",
          payload,
        });
      }

      if (recurrenceRule) {
        const result = await createRecurringFinancialRecords({
          record: payload,
          recurrence: recurrenceRule,
        });

        navigate("/", {
          replace: true,
          state: {
            toast: `${result.records.length} registros criados`,
            focusDueDate: dueDate,
          },
        });
        return;
      }

      await createFinancialRecord(payload);

      navigate("/", {
        replace: true,
        state: { toast: "Registro criado", focusDueDate: dueDate },
      });
    } catch (error) {
      setSaveError(getSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
      setScopeSheetOpen(false);
    }
  }

  async function handleSave() {
    if (isEditMode && isRecurringRecord) {
      setScopeSheetOpen(true);
      return;
    }

    await performSave();
  }

  async function handleScopeSelect(scope: RecurrenceScope) {
    await performSave(scope);
  }

  function handleBack() {
    if (isEditMode && recordId?.trim()) {
      navigate(`/records/${recordId.trim()}`);
      return;
    }
    navigate("/");
  }

  const pageTitle = isEditMode ? "Editar Movimentação" : "Nova Movimentação";
  const isPageLoading = isLoading || isLoadingRecord;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-text-primary">
          {pageTitle}
        </h1>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-link transition-opacity disabled:opacity-40"
        >
          {isSaving ? "Salvando…" : "Salvar"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {!isEditMode && !hasActiveWallet ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {NO_ACTIVE_WALLET_MESSAGE}
          </p>
        ) : null}

        {loadError ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {loadError}
          </p>
        ) : null}

        {loadRecordError ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {loadRecordError}
          </p>
        ) : null}

        {saveError ? (
          <p className="mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
            {saveError}
          </p>
        ) : null}

        {isRecurringRecord && scopeSheetOpen === false ? (
          <p className="mb-4 rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-text-secondary">
            Esta edição pode alterar apenas esta ocorrência ou também as próximas.
          </p>
        ) : null}

        {!isEditMode ? (
          <p className="mb-4 rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-text-secondary">
            {ATTACH_UNSAVED_RECORD_MESSAGE}
          </p>
        ) : null}

        {isPageLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando formulário…
          </p>
        ) : isRecordBlocked ? null : (
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface px-4">
            {isEditMode ? (
              <FormFieldRow
                label="Carteira"
                value={walletNameById[walletId] ?? "Selecionar"}
                onClick={() => setActivePicker("wallet")}
              />
            ) : null}

            <FormFieldRow
              label="Tipo"
              value={RECORD_TYPE_LABELS[type]}
              onClick={() => setActivePicker("type")}
            />

            <FormInputRow
              label="Descrição"
              value={description}
              placeholder="Ex.: Internet, Salário"
              onChange={setDescription}
            />

            <FormFieldRow
              label="Vencimento"
              value={formatIsoDatePtBr(dueDate)}
              onClick={() => setActivePicker("dueDate")}
            />

            <FormInputRow
              label="Valor previsto"
              value={expectedAmountInput}
              placeholder="0,00"
              onChange={setExpectedAmountInput}
            />

            <FormFieldRow
              label="Categoria"
              value={
                categoryId && categoryById[categoryId] ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <ThemeEntityAvatar
                      icon={categoryById[categoryId].icon as ThemeIconName}
                      color={categoryById[categoryId].color}
                      size="sm"
                    />
                    <span className="min-w-0 truncate">
                      {categoryById[categoryId].name}
                    </span>
                  </span>
                ) : categoryId ? (
                  "Categoria"
                ) : (
                  "Selecionar"
                )
              }
              onClick={() => setActivePicker("category")}
            />

            <FormFieldRow
              label="Favorecido"
              value={
                payeeId ? (payeeNameById[payeeId] ?? "Favorecido") : "Nenhum"
              }
              onClick={() => setActivePicker("payee")}
            />

            <FormFieldRow
              label="Observação"
              value={summarizeText(recordNote)}
              onClick={() => setActivePicker("notes")}
            />

            {!isEditMode ? (
              <FormFieldRow
                label="Recorrência"
                value={recurrenceSummary}
                onClick={() => setRecurrenceSheetOpen(true)}
              />
            ) : recurrenceLabel ? (
              <FormFieldRow
                label="Recorrência"
                value={recurrenceLabel}
                showChevron={false}
              />
            ) : null}
          </div>
        )}
      </div>

      {isEditMode && isRecurringRecord ? (
        <RecurrenceScopeSheet
          isOpen={scopeSheetOpen}
          title="Aplicar alterações em"
          onSelect={(scope) => void handleScopeSelect(scope)}
          onClose={() => setScopeSheetOpen(false)}
        />
      ) : null}

      {!isEditMode ? (
        <RecurrenceRuleSheet
          isOpen={recurrenceSheetOpen}
          startDate={dueDate}
          rule={recurrenceRule}
          onSave={setRecurrenceRule}
          onClose={() => setRecurrenceSheetOpen(false)}
        />
      ) : null}

      <DatePickerSheet
        isOpen={activePicker === "dueDate"}
        value={dueDate}
        onSave={setDueDate}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "type"}
        title="Tipo"
        selected={type}
        options={RECORD_TYPE_OPTIONS}
        getLabel={(option) => RECORD_TYPE_LABELS[option as FinancialRecordType]}
        onSelect={(option) => setType(option as FinancialRecordType)}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "wallet"}
        title="Carteira"
        selected={walletId}
        options={wallets.map((wallet) => wallet.id)}
        getLabel={(id) => walletNameById[id] ?? id}
        onSelect={setWalletId}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "category"}
        title="Categoria"
        selected={categoryId ?? ""}
        options={categories.map((category) => category.id)}
        getLabel={(id) => categoryById[id]?.name ?? id}
        renderOption={(id) => {
          const category = categoryById[id];
          if (!category) {
            return (
              <span className="text-sm font-medium text-text-primary">{id}</span>
            );
          }

          return (
            <>
              <ThemeEntityAvatar
                icon={category.icon as ThemeIconName}
                color={category.color}
                size="sm"
              />
              <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                {category.name}
              </span>
            </>
          );
        }}
        onSelect={setCategoryId}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "payee"}
        title="Favorecido"
        selected={payeeId ?? NONE_OPTION}
        options={[NONE_OPTION, ...payees.map((payee) => payee.id)]}
        getLabel={(id) =>
          id === NONE_OPTION ? "Nenhum" : (payeeNameById[id] ?? id)
        }
        onSelect={(id) => setPayeeId(id === NONE_OPTION ? null : id)}
        onClose={() => setActivePicker(null)}
      />

      <TextEditorSheet
        isOpen={activePicker === "notes"}
        title="Observação"
        value={recordNote}
        placeholder="Opcional"
        onSave={setRecordNote}
        onClose={() => setActivePicker(null)}
      />
    </div>
  );
}

/** @deprecated Use FinancialRecordFormPage */
export const CreateFinancialRecordPage = FinancialRecordFormPage;
