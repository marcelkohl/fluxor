import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
import { createFinancialRecord } from "@/features/financial-records/application";
import type { FinancialRecordType } from "@/features/financial-records/domain";
import { useCreateRecordCatalogs } from "@/features/financial-records/hooks/useCreateRecordCatalogs";
import { parseExpectedAmountToCents } from "@/features/financial-records/utils/parse-expected-amount";
import { ATTACH_UNSAVED_RECORD_MESSAGE } from "@/features/document-storage/types/attachment-operation-state";
import { getPersistenceConfig } from "@/features/persistence-setup";

const NONE_OPTION = "__none__";

const NO_ACTIVE_WALLET_MESSAGE =
  "Selecione uma carteira na Home antes de criar um registro.";

const RECORD_TYPE_OPTIONS: readonly FinancialRecordType[] = [
  "payable",
  "receivable",
];

const RECORD_TYPE_LABELS: Record<FinancialRecordType, string> = {
  payable: "A pagar",
  receivable: "A receber",
};

type ActivePicker = "type" | "dueDate" | "category" | "payee" | "notes" | null;

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

interface CreateRecordLocationState {
  walletId?: string;
}

export function CreateFinancialRecordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationWalletId = (location.state as CreateRecordLocationState | null)
    ?.walletId;

  const { categories, payees, isLoading, error: loadError } =
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

  const hasActiveWallet = hasActiveWalletId(activeAccountId);

  const [type, setType] = useState<FinancialRecordType>("payable");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [payeeId, setPayeeId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayIsoDate);
  const [expectedAmountInput, setExpectedAmountInput] = useState("");
  const [recordNote, setRecordNote] = useState("");
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const canSave =
    !isLoading &&
    !isSaving &&
    hasActiveWallet &&
    Boolean(categoryId) &&
    description.trim().length > 0 &&
    dueDate.trim().length > 0 &&
    expectedAmountInput.trim().length > 0;

  async function handleSave() {
    setSaveError(null);

    if (!hasActiveWallet) {
      setSaveError(NO_ACTIVE_WALLET_MESSAGE);
      return;
    }

    if (!shouldUseHomeMocks() && !isValidEntityId(activeAccountId)) {
      setSaveError("Carteira inválida. Selecione uma carteira válida.");
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

    if (!shouldUseHomeMocks() && !isValidEntityId(categoryId)) {
      setSaveError("Categoria inválida.");
      return;
    }

    if (payeeId && !shouldUseHomeMocks() && !isValidEntityId(payeeId)) {
      setSaveError("Favorecido inválido.");
      return;
    }

    setIsSaving(true);

    const walletId = getActiveAccountId().trim();
    const resolvedWalletId =
      walletId && isValidEntityId(walletId)
        ? walletId
        : activeAccountId.trim();

    if (!shouldUseHomeMocks() && !isValidEntityId(resolvedWalletId)) {
      setSaveError("Carteira inválida. Selecione uma carteira válida.");
      setIsSaving(false);
      return;
    }

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

    if (import.meta.env.DEV) {
      const config = getPersistenceConfig();
      logRemoteDev("[CreateRecord] active walletId", {
        storeWalletId: walletId,
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
        endpoint: "POST /api/v1/financial-records",
        payload,
      });
    }

    try {
      await createFinancialRecord(payload);

      navigate("/", {
        replace: true,
        state: { toast: "Registro criado", focusDueDate: dueDate },
      });
    } catch (error) {
      setSaveError(getSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate("/")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-text-primary">
          Nova Movimentação
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
        {!hasActiveWallet ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {NO_ACTIVE_WALLET_MESSAGE}
          </p>
        ) : null}

        {loadError ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {loadError}
          </p>
        ) : null}

        {saveError ? (
          <p className="mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
            {saveError}
          </p>
        ) : null}

        <p className="mb-4 rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-text-secondary">
          {ATTACH_UNSAVED_RECORD_MESSAGE}
        </p>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando formulário…
          </p>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface px-4">
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
          </div>
        )}
      </div>

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
