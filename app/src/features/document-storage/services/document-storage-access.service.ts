import { DocumentStorageNotConfiguredError } from "../errors/document-storage-not-configured.error";
import { getDocumentStorageConfig } from "./document-storage-config.service";
import { validateStorageProviderAccess } from "./resolve-storage-provider-validation.service";

const LOCAL_STORAGE_PROVIDER_ID = "local-storage";

export async function assertDocumentStorageRootAccess(): Promise<string> {
  const config = getDocumentStorageConfig();
  if (!config) {
    throw new DocumentStorageNotConfiguredError();
  }

  await validateStorageProviderAccess(
    LOCAL_STORAGE_PROVIDER_ID,
    config.rootFolderPath,
  );

  return config.rootFolderPath;
}
