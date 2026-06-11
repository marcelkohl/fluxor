import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import {
  getDatabaseService,
  initializeDatabase,
} from "@/features/database";
import type { DatabaseStatus } from "@/features/database";
import {
  getPersistenceConfig,
  getPersistenceModeLabel,
  testRemoteServerConnection,
  type RemoteServerTestResult,
} from "@/features/persistence-setup";

import {
  runAttachmentsTest,
  type AttachmentsTestResult,
} from "./run-attachments-test";
import {
  runStorageAccessTest,
  type StorageAccessTestResult,
} from "./run-storage-access-test";
import {
  runBasicCatalogTest,
  type BasicCatalogTestResult,
} from "./run-basic-catalog-test";
import {
  runFinancialRecordsTest,
  type FinancialRecordsTestResult,
} from "./run-financial-records-test";

function TestResultBlock({
  title,
  result,
}: {
  title: string;
  result: {
    success: boolean;
    message?: string;
    error?: string;
    provider?: string;
    steps?: Array<{ name: string; status: string; message?: string }>;
  };
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
        {title}
      </h2>
      <div className="p-4">
        {result.provider ? (
          <p className="mb-2 text-xs text-muted">
            Provider: {result.provider === "remote" ? "Remoto" : "Local"}
          </p>
        ) : null}
        <p
          className={`mb-3 text-sm font-medium ${
            result.success ? "text-income" : "text-expense"
          }`}
        >
          {result.success ? "Sucesso" : "Falha"}
          {result.message ? ` — ${result.message}` : ""}
          {result.error ? ` — ${result.error}` : ""}
        </p>
        {result.steps?.length ? (
          <ul className="mb-3 space-y-1 text-xs text-text-secondary">
            {result.steps.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-text-primary">{item.name}</span>
                {": "}
                {item.status}
                {item.message ? ` — ${item.message}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-soft p-3 text-xs text-text-primary">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </section>
  );
}

interface ProviderDiagnostics {
  providerLabel: string;
  remoteBaseUrl?: string;
  apiStatus?: string;
  databaseStatus?: string;
  remoteTest?: RemoteServerTestResult;
  localDatabase?: DatabaseStatus | null;
}

export function DatabaseDevPanel() {
  const [diagnostics, setDiagnostics] = useState<ProviderDiagnostics | null>(
    null,
  );
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(true);
  const [runningCatalogTest, setRunningCatalogTest] = useState(false);
  const [runningRecordsTest, setRunningRecordsTest] = useState(false);
  const [runningAttachmentsTest, setRunningAttachmentsTest] = useState(false);
  const [runningStorageAccessTest, setRunningStorageAccessTest] = useState(false);
  const [catalogTestResult, setCatalogTestResult] =
    useState<BasicCatalogTestResult | null>(null);
  const [recordsTestResult, setRecordsTestResult] =
    useState<FinancialRecordsTestResult | null>(null);
  const [attachmentsTestResult, setAttachmentsTestResult] =
    useState<AttachmentsTestResult | null>(null);
  const [storageAccessTestResult, setStorageAccessTestResult] =
    useState<StorageAccessTestResult | null>(null);

  const refreshDiagnostics = useCallback(async () => {
    setLoadingDiagnostics(true);

    try {
      const config = getPersistenceConfig();

      if (!config) {
        setDiagnostics({
          providerLabel: "Não configurado",
        });
        return;
      }

      if (config.mode === "remote") {
        const remoteTest = config.remoteBaseUrl
          ? await testRemoteServerConnection(config.remoteBaseUrl)
          : undefined;

        setDiagnostics({
          providerLabel: getPersistenceModeLabel("remote"),
          remoteBaseUrl: config.remoteBaseUrl,
          apiStatus:
            remoteTest?.outcome === "success" ? "conectado" : "erro",
          databaseStatus: remoteTest?.details?.databaseConnected
            ? "conectado"
            : "erro",
          remoteTest,
        });
        return;
      }

      let localDatabase: DatabaseStatus | null = null;
      if (isTauri()) {
        localDatabase = await initializeDatabase();
      }

      setDiagnostics({
        providerLabel: getPersistenceModeLabel("local"),
        localDatabase,
      });
    } finally {
      setLoadingDiagnostics(false);
    }
  }, []);

  useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics]);

  async function handleRunCatalogTest() {
    setRunningCatalogTest(true);
    try {
      const result = await runBasicCatalogTest();
      setCatalogTestResult(result);
      await refreshDiagnostics();
    } finally {
      setRunningCatalogTest(false);
    }
  }

  async function handleRunRecordsTest() {
    setRunningRecordsTest(true);
    try {
      const result = await runFinancialRecordsTest();
      setRecordsTestResult(result);
      await refreshDiagnostics();
    } finally {
      setRunningRecordsTest(false);
    }
  }

  async function handleRunAttachmentsTest() {
    setRunningAttachmentsTest(true);
    try {
      const result = await runAttachmentsTest();
      setAttachmentsTestResult(result);
      await refreshDiagnostics();
    } finally {
      setRunningAttachmentsTest(false);
    }
  }

  async function handleRunStorageAccessTest() {
    setRunningStorageAccessTest(true);
    try {
      const result = await runStorageAccessTest();
      setStorageAccessTestResult(result);
    } finally {
      setRunningStorageAccessTest(false);
    }
  }

  const config = getPersistenceConfig();
  const inBrowser = !isTauri();
  const isRemote = config?.mode === "remote";
  const serviceState = getDatabaseService().getState();

  return (
    <div className="space-y-4 p-4">
      {inBrowser && !isRemote && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          SQLite disponível apenas no Tauri. Configure modo Remoto para testar no
          browser.
        </div>
      )}

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
          Provider ativo
        </h2>
        <div className="space-y-2 p-4 text-sm text-text-primary">
          {loadingDiagnostics ? (
            <p className="text-text-secondary">Carregando…</p>
          ) : (
            <>
              <p>
                Provider ativo:{" "}
                <span className="font-medium">
                  {diagnostics?.providerLabel ?? "—"}
                </span>
              </p>
              {isRemote && diagnostics?.remoteBaseUrl ? (
                <>
                  <p className="break-all text-xs text-muted">
                    URL: {diagnostics.remoteBaseUrl}
                  </p>
                  <p>
                    Status da API:{" "}
                    <span className="font-medium">
                      {diagnostics.apiStatus ?? "—"}
                    </span>
                  </p>
                  <p>
                    Banco remoto:{" "}
                    <span className="font-medium">
                      {diagnostics.databaseStatus ?? "—"}
                    </span>
                  </p>
                  {diagnostics.remoteTest ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-surface-soft p-3 text-xs text-text-primary">
                      {JSON.stringify(diagnostics.remoteTest, null, 2)}
                    </pre>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      </section>

      {!isRemote && (
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
            Status do banco local
          </h2>
          <div className="p-4">
            {loadingDiagnostics ? (
              <p className="text-sm text-text-secondary">Carregando…</p>
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-surface-soft p-3 text-xs text-text-primary">
                {JSON.stringify(
                  diagnostics?.localDatabase ?? serviceState,
                  null,
                  2,
                )}
              </pre>
            )}
          </div>
        </section>
      )}

      {!isRemote && (
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
            Migrations aplicadas
          </h2>
          <div className="px-4 py-3">
            {diagnostics?.localDatabase?.appliedMigrations?.length ? (
              <ul className="list-inside list-disc text-sm text-text-primary">
                {diagnostics.localDatabase.appliedMigrations.map((version) => (
                  <li key={version}>v{version}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">
                {inBrowser
                  ? "N/A no browser"
                  : "Nenhuma migration registrada ou banco ainda não inicializado"}
              </p>
            )}
            {diagnostics?.localDatabase?.latestMigrationVersion != null && (
              <p className="mt-2 text-xs text-text-secondary">
                Última versão no código: v
                {diagnostics.localDatabase.latestMigrationVersion}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <button
          type="button"
          disabled={
            runningCatalogTest ||
            runningRecordsTest ||
            runningAttachmentsTest ||
            runningStorageAccessTest ||
            !config
          }
          onClick={() => void handleRunCatalogTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningCatalogTest
            ? "Executando teste…"
            : "Testar cadastros básicos"}
        </button>
        <button
          type="button"
          disabled={
            runningCatalogTest ||
            runningRecordsTest ||
            runningAttachmentsTest ||
            runningStorageAccessTest ||
            !config
          }
          onClick={() => void handleRunRecordsTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningRecordsTest
            ? "Executando teste…"
            : "Testar registros financeiros"}
        </button>
        <button
          type="button"
          disabled={
            runningCatalogTest ||
            runningRecordsTest ||
            runningAttachmentsTest ||
            runningStorageAccessTest ||
            !config
          }
          onClick={() => void handleRunAttachmentsTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningAttachmentsTest
            ? "Executando teste…"
            : "Testar attachments"}
        </button>
        <button
          type="button"
          disabled={
            runningCatalogTest ||
            runningRecordsTest ||
            runningAttachmentsTest ||
            runningStorageAccessTest
          }
          onClick={() => void handleRunStorageAccessTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningStorageAccessTest
            ? "Executando teste…"
            : "Testar storage local"}
        </button>
      </section>

      {catalogTestResult && (
        <TestResultBlock
          title="Resultado — cadastros básicos"
          result={catalogTestResult}
        />
      )}

      {recordsTestResult && (
        <TestResultBlock
          title="Resultado — registros financeiros"
          result={recordsTestResult}
        />
      )}

      {attachmentsTestResult && (
        <TestResultBlock
          title="Resultado — attachments"
          result={attachmentsTestResult}
        />
      )}

      {storageAccessTestResult && (
        <TestResultBlock
          title="Resultado — storage local"
          result={storageAccessTestResult}
        />
      )}
    </div>
  );
}
