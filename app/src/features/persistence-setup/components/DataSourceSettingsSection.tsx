import { useState } from "react";

import { getPersistenceModeLabel } from "../application";
import {
  getPersistenceConfig,
  resetPersistenceConfig,
  testRemoteServerConnection,
  type RemoteServerTestResult,
} from "../services";
import { RemoteConnectionTestResult } from "./RemoteConnectionTestResult";

export function DataSourceSettingsSection() {
  const config = getPersistenceConfig();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<RemoteServerTestResult | null>(
    null,
  );

  if (!config) {
    return (
      <section aria-label="Fonte de dados">
        <p className="text-sm text-text-secondary">
          Nenhuma fonte de dados configurada.
        </p>
      </section>
    );
  }

  function handleReconfigure() {
    resetPersistenceConfig();
    window.location.reload();
  }

  async function handleTestConnection() {
    if (config?.mode !== "remote" || !config.remoteBaseUrl) {
      return;
    }

    setTesting(true);
    try {
      const result = await testRemoteServerConnection(config.remoteBaseUrl);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  }

  return (
    <section aria-label="Fonte de dados">
      <p className="text-xs text-text-secondary">
        Modo atual:{" "}
        <span className="font-medium text-text-primary">
          {getPersistenceModeLabel(config.mode)}
        </span>
      </p>
      {config.mode === "remote" && config.remoteBaseUrl ? (
        <>
          <p className="mt-1 break-all text-xs text-muted">
            {config.remoteBaseUrl}
          </p>
          <button
            type="button"
            disabled={testing}
            onClick={() => void handleTestConnection()}
            className="mt-4 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-50"
          >
            {testing ? "Testando conexão…" : "Testar conexão"}
          </button>
          {testResult || testing ? (
            <div className="mt-3">
              <RemoteConnectionTestResult result={testResult} testing={testing} />
            </div>
          ) : null}
        </>
      ) : null}
      <button
        type="button"
        onClick={handleReconfigure}
        className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft"
      >
        Reconfigurar fonte de dados
      </button>
    </section>
  );
}
