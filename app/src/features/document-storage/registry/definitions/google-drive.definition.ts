import type { StorageProviderDefinition } from "../storage-provider-registry.types";

export const googleDriveProviderDefinition: StorageProviderDefinition = {
  id: "google-drive",
  name: "Google Drive",
  description: "Integração futura com Google Drive.",
  icon: "storageGoogleDrive",
  status: "disabled",
  enabled: false,
  supportsUpload: false,
  supportsDownload: false,
  supportsSync: false,
  hasConfiguration: false,
};
