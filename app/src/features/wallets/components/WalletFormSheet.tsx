import { useEffect, useState } from "react";

import {
  ColorPickerSheet,
  FormFieldRow,
  FormInputRow,
  FormSheetHeader,
  FormSheetPanel,
  FormToggleRow,
  IconPickerSheet,
  SheetScaffold,
  TextEditorSheet,
} from "@/components/admin-form";
import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { getThemeColorLabel } from "@/config/theme/theme.palette";
import type { ThemePaletteColor } from "@/config/theme/theme.palette";
import {
  ValidationError,
  NotFoundError,
  DatabaseNotReadyError,
} from "@/features/database";
import {
  archiveWallet,
  createWallet,
  setDefaultWallet,
  updateWallet,
} from "@/features/wallets/application";
import {
  DEFAULT_WALLET_COLOR,
  DEFAULT_WALLET_ICON,
  walletColorOptions,
  walletIconLabels,
  walletIconOptions,
  type WalletIconOption,
} from "@/features/wallets/config/wallet-options";
import type { Wallet } from "@/features/wallets/domain";

export interface WalletFormSheetProps {
  isOpen: boolean;
  mode: "create" | "edit";
  wallet: Wallet | null;
  isFirstWallet: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

interface WalletFormState {
  name: string;
  icon: WalletIconOption;
  color: ThemePaletteColor;
  notes: string;
  isDefault: boolean;
}

type ActivePicker = "icon" | "color" | "notes" | null;

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
  return "Não foi possível salvar a carteira.";
}

function logWalletError(context: string, error: unknown): void {
  console.error(`[WalletFormSheet] ${context}`, error);
}

function buildInitialState(
  wallet: Wallet | null,
  isFirstWallet: boolean,
): WalletFormState {
  if (wallet) {
    const icon = walletIconOptions.includes(wallet.icon as WalletIconOption)
      ? (wallet.icon as WalletIconOption)
      : DEFAULT_WALLET_ICON;
    const color = walletColorOptions.includes(wallet.color as ThemePaletteColor)
      ? (wallet.color as ThemePaletteColor)
      : DEFAULT_WALLET_COLOR;

    return {
      name: wallet.name,
      icon,
      color,
      notes: wallet.notes ?? "",
      isDefault: wallet.isDefault,
    };
  }

  return {
    name: "",
    icon: DEFAULT_WALLET_ICON,
    color: DEFAULT_WALLET_COLOR,
    notes: "",
    isDefault: isFirstWallet,
  };
}

export function WalletFormSheet({
  isOpen,
  mode,
  wallet,
  isFirstWallet,
  onClose,
  onSaved,
}: WalletFormSheetProps) {
  const [form, setForm] = useState<WalletFormState>(() =>
    buildInitialState(wallet, isFirstWallet),
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState(wallet, isFirstWallet));
      setActivePicker(null);
      setError(null);
      setShowArchiveConfirm(false);
    }
  }, [isOpen, wallet, isFirstWallet]);

  if (!isOpen) {
    return null;
  }

  const title = mode === "create" ? "Nova carteira" : "Editar carteira";
  const canUnsetDefault = mode === "edit" && wallet?.isDefault;

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const trimmedName = form.name.trim();
      const notes = form.notes.trim() ? form.notes.trim() : null;
      let walletId: string;

      if (mode === "create") {
        const created = await createWallet({
          name: trimmedName,
          icon: form.icon,
          color: form.color,
          notes,
          isDefault: false,
        });
        walletId = created.id;
      } else if (wallet) {
        await updateWallet({
          walletId: wallet.id,
          name: trimmedName,
          icon: form.icon,
          color: form.color,
          notes,
        });
        walletId = wallet.id;
      } else {
        return;
      }

      if (form.isDefault) {
        await setDefaultWallet(walletId);
      }

      await onSaved();
      onClose();
    } catch (saveError) {
      logWalletError("Falha ao salvar carteira", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!wallet) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await archiveWallet(wallet.id);
      await onSaved();
      onClose();
    } catch (archiveError) {
      logWalletError("Falha ao arquivar carteira", archiveError);
      setError(getErrorMessage(archiveError));
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  }

  const archiveFooter =
    mode === "edit" && wallet ? (
      <footer className="border-t border-border px-4 py-3">
        {showArchiveConfirm ? (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Arquivar &ldquo;{wallet.name}&rdquo;? A carteira deixa de aparecer
              nas telas operacionais, mas os dados permanecem salvos.
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
            Arquivar carteira
          </button>
        )}
      </footer>
    ) : null;

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        titleId="wallet-form-title"
        onClose={onClose}
      >
        <FormSheetPanel footer={archiveFooter}>
          <FormSheetHeader
            title={title}
            titleId="wallet-form-title"
            onCancel={onClose}
            onSave={() => void handleSave()}
            saveDisabled={!form.name.trim()}
            isSaving={isSaving}
          />

          <div className="divide-y divide-border/50 px-4">
            <FormInputRow
              label="Nome"
              value={form.name}
              placeholder="Carteira Pessoal"
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />

            <FormFieldRow
              label="Ícone"
              value={
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-link-soft text-link">
                    <ThemeIcon name={form.icon as ThemeIconName} size="sm" />
                  </span>
                  <span className="truncate">{walletIconLabels[form.icon]}</span>
                </span>
              }
              onClick={() => setActivePicker("icon")}
            />

            <FormFieldRow
              label="Cor"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: form.color }}
                    aria-hidden
                  />
                  <span className="truncate">
                    {getThemeColorLabel(form.color)}
                  </span>
                </span>
              }
              onClick={() => setActivePicker("color")}
            />

            <FormFieldRow
              label="Observação"
              value={summarizeText(form.notes)}
              onClick={() => setActivePicker("notes")}
            />

            <FormToggleRow
              label="Carteira padrão"
              checked={form.isDefault}
              disabled={Boolean(canUnsetDefault && form.isDefault)}
              onChange={(isDefault) =>
                setForm((current) => ({ ...current, isDefault }))
              }
            />
          </div>

          {canUnsetDefault && form.isDefault ? (
            <p className="px-4 pb-2 text-xs text-text-secondary">
              Para remover o padrão, defina outra carteira como padrão.
            </p>
          ) : null}

          {error ? (
            <p className="mx-4 mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
              {error}
            </p>
          ) : null}
        </FormSheetPanel>
      </SheetScaffold>

      <IconPickerSheet
        isOpen={activePicker === "icon"}
        title="Ícone"
        selected={form.icon}
        options={walletIconOptions}
        getLabel={(icon) => walletIconLabels[icon as WalletIconOption]}
        onSelect={(icon) =>
          setForm((current) => ({
            ...current,
            icon: icon as WalletIconOption,
          }))
        }
        onClose={() => setActivePicker(null)}
      />

      <ColorPickerSheet
        isOpen={activePicker === "color"}
        title="Cor"
        selected={form.color}
        options={walletColorOptions}
        getLabel={(color) => getThemeColorLabel(color as ThemePaletteColor)}
        onSelect={(color) =>
          setForm((current) => ({
            ...current,
            color: color as ThemePaletteColor,
          }))
        }
        onClose={() => setActivePicker(null)}
      />

      <TextEditorSheet
        isOpen={activePicker === "notes"}
        title="Observação"
        value={form.notes}
        placeholder="Notas opcionais sobre a carteira"
        onSave={(notes) => setForm((current) => ({ ...current, notes }))}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
