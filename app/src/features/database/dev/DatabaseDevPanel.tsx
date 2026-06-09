import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import {
  getDatabaseService,
  initializeDatabase,
} from "@/features/database";
import type { DatabaseStatus } from "@/features/database";

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
  result: { success: boolean; message?: string; error?: string };
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
        {title}
      </h2>
      <div className="p-4">
        <p
          className={`mb-3 text-sm font-medium ${
            result.success ? "text-income" : "text-expense"
          }`}
        >
          {result.success ? "Sucesso" : "Falha"}
          {result.message ? ` — ${result.message}` : ""}
          {result.error ? ` — ${result.error}` : ""}
        </p>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-soft p-3 text-xs text-text-primary">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </section>
  );
}

export function DatabaseDevPanel() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [runningCatalogTest, setRunningCatalogTest] = useState(false);
  const [runningRecordsTest, setRunningRecordsTest] = useState(false);
  const [catalogTestResult, setCatalogTestResult] =
    useState<BasicCatalogTestResult | null>(null);
  const [recordsTestResult, setRecordsTestResult] =
    useState<FinancialRecordsTestResult | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const next = await initializeDatabase();
      setStatus(next);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleRunCatalogTest() {
    setRunningCatalogTest(true);
    try {
      const result = await runBasicCatalogTest();
      setCatalogTestResult(result);
      await refreshStatus();
    } finally {
      setRunningCatalogTest(false);
    }
  }

  async function handleRunRecordsTest() {
    setRunningRecordsTest(true);
    try {
      const result = await runFinancialRecordsTest();
      setRecordsTestResult(result);
      await refreshStatus();
    } finally {
      setRunningRecordsTest(false);
    }
  }

  const serviceState = getDatabaseService().getState();
  const inBrowser = !isTauri();

  return (
    <div className="space-y-4 p-4">
      {inBrowser && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          SQLite disponível apenas no Tauri
        </div>
      )}

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
          Status do banco
        </h2>
        <div className="p-4">
          {loadingStatus ? (
            <p className="text-sm text-text-secondary">Carregando…</p>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-surface-soft p-3 text-xs text-text-primary">
              {JSON.stringify(
                status ?? serviceState,
                null,
                2,
              )}
            </pre>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-text-primary">
          Migrations aplicadas
        </h2>
        <div className="px-4 py-3">
          {status?.appliedMigrations?.length ? (
            <ul className="list-inside list-disc text-sm text-text-primary">
              {status.appliedMigrations.map((version) => (
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
          {status?.latestMigrationVersion != null && (
            <p className="mt-2 text-xs text-text-secondary">
              Última versão no código: v{status.latestMigrationVersion}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <button
          type="button"
          disabled={runningCatalogTest || runningRecordsTest}
          onClick={() => void handleRunCatalogTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningCatalogTest
            ? "Executando teste…"
            : "Testar cadastros básicos"}
        </button>
        <button
          type="button"
          disabled={runningCatalogTest || runningRecordsTest}
          onClick={() => void handleRunRecordsTest()}
          className="w-full rounded-lg bg-action-gradient px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {runningRecordsTest
            ? "Executando teste…"
            : "Testar registros financeiros"}
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
    </div>
  );
}
