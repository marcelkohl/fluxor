import { isTauri } from "@tauri-apps/api/core";

import {
  ensureDatabaseReady,
  getDatabaseService,
  initializeDatabase,
} from "@/features/database";
import { getPersistenceConfig } from "@/features/persistence-setup";

export type DevTestProvider = "local" | "remote";

export type DevTestStepStatus = "ok" | "skipped" | "failed";

export interface DevTestStep {
  name: string;
  status: DevTestStepStatus;
  message?: string;
}

export interface DevTestContext {
  provider: DevTestProvider;
  remoteBaseUrl?: string;
}

export type DevTestEnvironment = "tauri" | "browser";

export interface DevTestBaseResult {
  ranAt: string;
  environment: DevTestEnvironment;
  provider: DevTestProvider;
  remoteBaseUrl?: string;
  success: boolean;
  message?: string;
  steps?: DevTestStep[];
  error?: string;
}

export async function resolveDevTestContext(): Promise<
  DevTestContext | { error: string }
> {
  const config = getPersistenceConfig();
  if (!config) {
    return { error: "Persistência não configurada" };
  }

  if (config.mode === "remote") {
    if (!config.remoteBaseUrl) {
      return { error: "URL do servidor remoto não configurada" };
    }

    return {
      provider: "remote",
      remoteBaseUrl: config.remoteBaseUrl,
    };
  }

  if (!isTauri()) {
    return {
      error:
        "Modo local requer o aplicativo desktop (Tauri). Use modo Remoto no browser.",
    };
  }

  await initializeDatabase();
  const status = getDatabaseService().getState();
  if (status.status !== "ready") {
    return {
      error: status.message ?? "Banco local não está pronto",
    };
  }

  await ensureDatabaseReady();

  return { provider: "local" };
}

export function getDevTestEnvironment(): DevTestEnvironment {
  return isTauri() ? "tauri" : "browser";
}

export function isRemoteFeatureNotSupported(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "RemoteFeatureNotSupportedError"
  );
}
