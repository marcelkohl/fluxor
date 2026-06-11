import type { StorageProviderDefinition } from "../storage-provider-registry.types";

export const localStorageProviderDefinition: StorageProviderDefinition = {
  id: "local-storage",
  name: "Local Storage",
  description: "Armazena anexos em uma pasta local organizada automaticamente.",
  icon: "storageLocalFolder",
  status: "active",
  enabled: true,
  supportsUpload: true,
  supportsDownload: false,
  supportsSync: true,
  hasConfiguration: true,
};
