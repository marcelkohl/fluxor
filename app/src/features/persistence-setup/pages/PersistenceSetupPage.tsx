import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import type { PersistenceConfig } from "../types";
import {
  normalizeRemoteBaseUrl,
  savePersistenceConfig,
  testRemoteServerConnection,
  type RemoteServerTestResult,
} from "../services";
import { PersistenceModeCard } from "../components/PersistenceModeCard";
import { RemoteConnectionTestResult } from "../components/RemoteConnectionTestResult";

type SetupStep = "choose" | "remote";

interface PersistenceSetupPageProps {
  onConfigured: (config: PersistenceConfig) => void;
}

export function PersistenceSetupPage({ onConfigured }: PersistenceSetupPageProps) {
  const [step, setStep] = useState<SetupStep>("choose");
  const [remoteBaseUrl, setRemoteBaseUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<RemoteServerTestResult | null>(
    null,
  );
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);

  function handleSelectLocal() {
    setMessage(null);

    if (!isTauri()) {
      setMessage("O modo local requer o aplicativo desktop.");
      return;
    }

    const config = savePersistenceConfig({ mode: "local" });
    onConfigured(config);
  }

  function handleSelectRemote() {
    setMessage(null);
    setTestResult(null);
    setValidatedUrl(null);
    setStep("remote");
  }

  function handleUrlChange(value: string) {
    setRemoteBaseUrl(value);
    setTestResult(null);
    setValidatedUrl(null);
    setMessage(null);
  }

  async function handleTestConnection() {
    setMessage(null);
    setTesting(true);

    try {
      const result = await testRemoteServerConnection(remoteBaseUrl);
      setTestResult(result);

      if (result.outcome === "success" && result.normalizedUrl) {
        setValidatedUrl(result.normalizedUrl);
        setRemoteBaseUrl(result.normalizedUrl);
      } else {
        setValidatedUrl(null);
      }
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveRemote(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const normalized = normalizeRemoteBaseUrl(remoteBaseUrl);
    if (!normalized) {
      setMessage("Informe uma URL válida (HTTP ou HTTPS).");
      return;
    }

    let urlToSave = validatedUrl;

    if (validatedUrl !== normalized) {
      setTesting(true);
      try {
        const result = await testRemoteServerConnection(normalized);
        setTestResult(result);

        if (result.outcome !== "success" || !result.normalizedUrl) {
          return;
        }

        urlToSave = result.normalizedUrl;
        setValidatedUrl(result.normalizedUrl);
      } finally {
        setTesting(false);
      }
    }

    const config = savePersistenceConfig({
      mode: "remote",
      remoteBaseUrl: urlToSave ?? normalized,
    });

    onConfigured(config);
  }

  const canSave =
    Boolean(normalizeRemoteBaseUrl(remoteBaseUrl)) &&
    validatedUrl === normalizeRemoteBaseUrl(remoteBaseUrl) &&
    testResult?.outcome === "success";

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-xl font-semibold text-text-primary">
          Configurar Fluxor
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Como deseja armazenar seus dados?
        </p>

        {step === "choose" ? (
          <div className="mt-6 space-y-3">
            <PersistenceModeCard
              title="Usar localmente neste dispositivo"
              description="Os dados ficam armazenados neste computador. Funciona offline."
              onSelect={handleSelectLocal}
            />
            <PersistenceModeCard
              title="Usar servidor remoto"
              description="Os dados ficam armazenados em um servidor. Permite acesso via navegador e múltiplos dispositivos."
              onSelect={handleSelectRemote}
            />
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSaveRemote}>
            <div>
              <label
                htmlFor="remote-base-url"
                className="text-xs font-medium text-text-secondary"
              >
                URL do servidor
              </label>
              <input
                id="remote-base-url"
                type="url"
                value={remoteBaseUrl}
                onChange={(event) => handleUrlChange(event.target.value)}
                placeholder="http://localhost:3009"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-link"
              />
            </div>

            <button
              type="button"
              disabled={testing || !remoteBaseUrl.trim()}
              onClick={() => void handleTestConnection()}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-50"
            >
              {testing ? "Testando conexão…" : "Testar conexão"}
            </button>

            <RemoteConnectionTestResult result={testResult} testing={testing} />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setMessage(null);
                  setTestResult(null);
                  setValidatedUrl(null);
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={testing || !canSave}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
              >
                Continuar
              </button>
            </div>

            {!canSave && remoteBaseUrl.trim() && !testing ? (
              <p className="text-xs text-muted">
                Teste a conexão com sucesso antes de continuar.
              </p>
            ) : null}
          </form>
        )}

        {message ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-soft px-3 py-2.5 text-sm text-text-secondary">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
