import { isTauri } from "@tauri-apps/api/core";

import { STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE } from "../../constants/storage-access-test.constants";
import { StorageProviderValidationError } from "../../errors/storage-provider-validation.error";
import type { StorageProviderValidationPort } from "../../ports/storage-provider-validation.port";
import { validateStorageRootViaRust } from "./local-folder-rust-io";

export class LocalFolderStorageValidation implements StorageProviderValidationPort {
  async validateAccess(rootPath: string): Promise<void> {
    if (!isTauri()) {
      return;
    }

    const normalizedRoot = rootPath.trim();
    if (!normalizedRoot) {
      throw new StorageProviderValidationError("Selecione uma pasta raiz válida.");
    }

    try {
      await validateStorageRootViaRust(normalizedRoot);
    } catch (error) {
      throw new StorageProviderValidationError(
        STORAGE_ACCESS_VALIDATION_FAILURE_MESSAGE,
        error,
      );
    }
  }
}

export const localFolderStorageValidation = new LocalFolderStorageValidation();
