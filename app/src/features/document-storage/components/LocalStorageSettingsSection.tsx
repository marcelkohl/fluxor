import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import {
  STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE,
  STORAGE_ACCESS_VALIDATION_SUCCESS_MESSAGE,
} from "../constants/storage-access-test.constants";
import { buildStoragePathPreview } from "../adapters/local-folder/local-folder-storage.provider";
import { StorageProviderValidationError } from "../errors/storage-provider-validation.error";
import { assertDocumentStorageRootAccess } from "../services/document-storage-access.service";
import {
  getDocumentStorageConfig,
  saveDocumentStorageConfig,
} from "../services/document-storage-config.service";
import { validateStorageProviderAccess } from "../services/resolve-storage-provider-validation.service";
import { openDirectoryPicker } from "../utils/open-directory-picker";

const LOCAL_STORAGE_PROVIDER_ID = "local-storage";

const TEMPLATE_DESCRIPTION =
  "/{wallet}/{year}/{month-name}/{kind-prefix}{filename-based-on-description}.{extension}";

const PREVIEW_WALLET = "Pessoal";
const PREVIEW_DUE_DATE = "2026-07-15";
const PREVIEW_DESCRIPTION = "Energia Elétrica";
const PREVIEW_FILENAME = "conta.pdf";

export function LocalStorageSettingsSection() {
  const [config, setConfig] = useState(getDocumentStorageConfig);
  const [picking, setPicking] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri() || !config?.rootFolderPath) {
      setAccessWarning(null);
      return;
    }

    setValidating(true);

    void assertDocumentStorageRootAccess()
      .then(() => setAccessWarning(null))
      .catch((error: unknown) => {
        if (error instanceof StorageProviderValidationError) {
          setAccessWarning(error.message);
          return;
        }

        setAccessWarning(STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE);
      })
      .finally(() => setValidating(false));
  }, [config?.rootFolderPath]);

  const previewDocumentPath = buildStoragePathPreview({
    walletName: PREVIEW_WALLET,
    dueDate: PREVIEW_DUE_DATE,
    recordDescription: PREVIEW_DESCRIPTION,
    sourceFilename: PREVIEW_FILENAME,
    kind: "document",
  });

  const previewReceiptPath = buildStoragePathPreview({
    walletName: PREVIEW_WALLET,
    dueDate: PREVIEW_DUE_DATE,
    recordDescription: PREVIEW_DESCRIPTION,
    sourceFilename: PREVIEW_FILENAME,
    kind: "receipt",
  });

  async function handlePickRootFolder() {
    if (!isTauri()) {
      setMessage(
        "A seleção de pasta raiz está disponível apenas no aplicativo desktop.",
      );
      return;
    }

    setPicking(true);
    setMessage(null);
    setAccessWarning(null);

    try {
      const selected = await openDirectoryPicker({
        title: "Pasta raiz para documentos",
      });

      if (!selected) {
        return;
      }

      setValidating(true);
      setMessage("Validando permissões de acesso…");

      await validateStorageProviderAccess(LOCAL_STORAGE_PROVIDER_ID, selected);

      const saved = saveDocumentStorageConfig(selected);
      setConfig(saved);
      setMessage(STORAGE_ACCESS_VALIDATION_SUCCESS_MESSAGE);
    } catch (error) {
      if (error instanceof StorageProviderValidationError) {
        setAccessWarning(error.message);
        setMessage(null);
        return;
      }

      setAccessWarning(STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE);
      setMessage(null);
    } finally {
      setPicking(false);
      setValidating(false);
    }
  }

  const isBusy = picking || validating;

  return (
    <section aria-label="Local Storage" className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Pasta raiz
        </p>
        <p className="mt-2 break-all text-sm text-text-primary">
          {config?.rootFolderPath ?? "Não configurada"}
        </p>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handlePickRootFolder()}
          className="mt-4 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-50"
        >
          {picking
            ? "Selecionando…"
            : validating
              ? "Validando…"
              : "Escolher pasta raiz"}
        </button>
        {!isTauri() ? (
          <p className="mt-3 text-xs text-text-secondary">
            No browser, configure a pasta raiz no aplicativo desktop (Tauri).
            Listagem e remoção de anexos continuam funcionando normalmente.
          </p>
        ) : null}
        {accessWarning ? (
          <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            {accessWarning}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 text-xs text-income">{message}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Template de organização
        </p>
        <p className="mt-2 font-mono text-xs text-text-primary">
          {TEMPLATE_DESCRIPTION}
        </p>
        <p className="mt-3 text-xs text-text-secondary">
          Prefixos: documento → <span className="font-mono">doc-</span>, comprovante →{" "}
          <span className="font-mono">rec-</span>
        </p>
        <p className="mt-3 text-xs text-text-secondary">Exemplos:</p>
        <p className="mt-1 font-mono text-xs text-text-primary">
          Documento: {previewDocumentPath}
        </p>
        <p className="mt-1 font-mono text-xs text-text-primary">
          Comprovante: {previewReceiptPath}
        </p>
      </div>
    </section>
  );
}
