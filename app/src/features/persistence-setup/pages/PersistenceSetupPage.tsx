import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import type { PersistenceConfig } from "../types";
import { savePersistenceConfig } from "../services";
import { PersistenceModeCard } from "../components/PersistenceModeCard";

type SetupStep = "choose" | "remote";

interface PersistenceSetupPageProps {
  onConfigured: (config: PersistenceConfig) => void;
}

export function PersistenceSetupPage({ onConfigured }: PersistenceSetupPageProps) {
  const [step, setStep] = useState<SetupStep>("choose");
  const [remoteBaseUrl, setRemoteBaseUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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
    setStep("remote");
  }

  function handleSaveRemote(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const trimmedUrl = remoteBaseUrl.trim();
    if (!trimmedUrl) {
      setMessage("Informe a URL do servidor.");
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setMessage("A URL deve usar HTTP ou HTTPS.");
        return;
      }
    } catch {
      setMessage("URL do servidor inválida.");
      return;
    }

    const config = savePersistenceConfig({
      mode: "remote",
      remoteBaseUrl: trimmedUrl,
    });

    setMessage("Servidor remoto ainda não implementado.");
    onConfigured(config);
  }

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
                onChange={(event) => setRemoteBaseUrl(event.target.value)}
                placeholder="https://api.meuservidor.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-link"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setMessage(null);
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-background"
              >
                Continuar
              </button>
            </div>
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
