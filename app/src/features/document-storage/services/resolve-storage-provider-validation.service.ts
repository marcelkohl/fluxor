import { isTauri } from "@tauri-apps/api/core";

import type { StorageProviderValidationPort } from "../ports/storage-provider-validation.port";
import { localFolderStorageValidation } from "../adapters/local-folder/local-folder-storage.validation";

class UnsupportedStorageValidation implements StorageProviderValidationPort {
  constructor(private readonly providerId: string) {}

  async validateAccess(): Promise<void> {
    throw new Error(
      `Validação de acesso não disponível para o provider "${this.providerId}".`,
    );
  }
}

class BrowserStorageValidation implements StorageProviderValidationPort {
  async validateAccess(): Promise<void> {
    // Validação física de pasta é exclusiva do desktop (Tauri).
  }
}

const browserStorageValidation = new BrowserStorageValidation();

export function resolveStorageProviderValidation(
  providerId: string,
): StorageProviderValidationPort {
  if (providerId === "local-storage") {
    return localFolderStorageValidation;
  }

  if (providerId === "google-drive") {
    return new UnsupportedStorageValidation(providerId);
  }

  return new UnsupportedStorageValidation(providerId);
}

export async function validateStorageProviderAccess(
  providerId: string,
  rootPath: string,
): Promise<void> {
  const validator = isTauri()
    ? resolveStorageProviderValidation(providerId)
    : browserStorageValidation;

  await validator.validateAccess(rootPath);
}
