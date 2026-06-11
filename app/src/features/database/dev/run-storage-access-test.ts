import { isTauri } from "@tauri-apps/api/core";

import {
  removeAttachmentFileViaRust,
  writeTempAttachmentFileViaRust,
} from "@/features/document-storage/adapters/local-folder/local-folder-rust-io";
import { localFolderStorageValidation } from "@/features/document-storage/adapters/local-folder/local-folder-storage.validation";
import { LocalFolderStorageProvider } from "@/features/document-storage/adapters/local-folder/local-folder-storage.provider";
import { STORAGE_ACCESS_TEST_PATHS } from "@/features/document-storage/constants/storage-access-test.constants";
import { getDocumentStorageConfig } from "@/features/document-storage/services/document-storage-config.service";
import {
  getDevTestEnvironment,
  type DevTestStep,
} from "@/features/database/dev/dev-test-context";

import type { DevTestBaseResult } from "./dev-test-context";

export interface StorageAccessTestResult extends DevTestBaseResult {
  rootFolderPath?: string;
  storedFilePath?: string;
}

function step(
  name: string,
  status: DevTestStep["status"],
  message?: string,
): DevTestStep {
  return { name, status, message };
}

export async function runStorageAccessTest(): Promise<StorageAccessTestResult> {
  const ranAt = new Date().toISOString();
  const environment = getDevTestEnvironment();
  const steps: DevTestStep[] = [];

  if (!isTauri()) {
    steps.push(
      step("validateAccess", "skipped", "Disponível apenas no Tauri"),
      step("storeFile", "skipped", "Disponível apenas no Tauri"),
    );

    return {
      ranAt,
      environment,
      provider: "local",
      success: true,
      message: "Teste de storage ignorado no browser",
      steps,
    };
  }

  const config = getDocumentStorageConfig();
  if (!config?.rootFolderPath) {
    steps.push(
      step("validateAccess", "skipped", "Pasta raiz não configurada"),
      step("storeFile", "skipped", "Pasta raiz não configurada"),
    );

    return {
      ranAt,
      environment,
      provider: "local",
      success: true,
      message: "Configure Local Storage antes de testar I/O",
      steps,
    };
  }

  let tempSourcePath: string | null = null;
  let storedFilePath: string | null = null;

  try {
    await localFolderStorageValidation.validateAccess(config.rootFolderPath);
    steps.push(step("validateAccess", "ok"));
  } catch (error) {
    steps.push(
      step(
        "validateAccess",
        "failed",
        error instanceof Error ? error.message : String(error),
      ),
    );
    steps.push(step("storeFile", "skipped", "validateAccess falhou"));

    return {
      ranAt,
      environment,
      provider: "local",
      success: false,
      rootFolderPath: config.rootFolderPath,
      steps,
      error: "validateAccess falhou",
    };
  }

  try {
    tempSourcePath = await writeTempAttachmentFileViaRust(
      STORAGE_ACCESS_TEST_PATHS.testContent,
    );

    const provider = new LocalFolderStorageProvider();
    const stored = await provider.storeFile({
      sourcePath: tempSourcePath,
      walletName: "Dev Test",
      dueDate: "2026-07-15",
      recordDescription: `Storage DEV ${Date.now()}`,
      sourceFilename: "dev-store-test.txt",
      kind: "document",
    });

    storedFilePath = stored.localPath;

    if (!stored.localPath.includes("doc-")) {
      throw new Error("Path gerado sem prefixo doc-");
    }

    const existsAfterStore = await provider.fileExists(stored.localPath);
    if (!existsAfterStore) {
      throw new Error("Arquivo copiado não encontrado após storeFile");
    }

    if (stored.size <= 0) {
      throw new Error("Arquivo copiado está vazio após storeFile");
    }

    steps.push(step("storeFile", "ok", stored.localPath));
  } catch (error) {
    steps.push(
      step(
        "storeFile",
        "failed",
        error instanceof Error ? error.message : String(error),
      ),
    );

    return {
      ranAt,
      environment,
      provider: "local",
      success: false,
      rootFolderPath: config.rootFolderPath,
      storedFilePath: storedFilePath ?? undefined,
      steps,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (tempSourcePath) {
      try {
        await removeAttachmentFileViaRust(tempSourcePath);
      } catch {
        // Limpeza best-effort do arquivo temporário de origem.
      }
    }
  }

  return {
    ranAt,
    environment,
    provider: "local",
    success: true,
    message: "Storage local validado com sucesso",
    rootFolderPath: config.rootFolderPath,
    storedFilePath: storedFilePath ?? undefined,
    steps,
  };
}
