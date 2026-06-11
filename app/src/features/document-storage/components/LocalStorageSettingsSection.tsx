import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { buildStoragePathPreview } from "../adapters/local-folder/local-folder-storage.provider";
import {
  getDocumentStorageConfig,
  saveDocumentStorageConfig,
} from "../services/document-storage-config.service";

const TEMPLATE_DESCRIPTION =
  "/{wallet}/{year}/{month-name}/{filename-based-on-description}.{extension}";

const PREVIEW_WALLET = "Pessoal";
const PREVIEW_DUE_DATE = "2026-07-15";
const PREVIEW_DESCRIPTION = "Energia Elétrica";
const PREVIEW_FILENAME = "conta.pdf";

export function LocalStorageSettingsSection() {
  const [config, setConfig] = useState(getDocumentStorageConfig);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewPath = buildStoragePathPreview({
    walletName: PREVIEW_WALLET,
    dueDate: PREVIEW_DUE_DATE,
    recordDescription: PREVIEW_DESCRIPTION,
    sourceFilename: PREVIEW_FILENAME,
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

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Pasta raiz para documentos",
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      const saved = saveDocumentStorageConfig(selected);
      setConfig(saved);
      setMessage("Pasta raiz atualizada.");
    } finally {
      setPicking(false);
    }
  }

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
          disabled={picking}
          onClick={() => void handlePickRootFolder()}
          className="mt-4 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-50"
        >
          {picking ? "Selecionando…" : "Escolher pasta raiz"}
        </button>
        {!isTauri() ? (
          <p className="mt-3 text-xs text-text-secondary">
            No browser, configure a pasta raiz no aplicativo desktop (Tauri).
            Listagem e remoção de anexos continuam funcionando normalmente.
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
        <p className="mt-3 text-xs text-text-secondary">Exemplo:</p>
        <p className="mt-1 font-mono text-xs text-text-primary">{previewPath}</p>
      </div>
    </section>
  );
}
