export type StorageProviderStatus = "active" | "disabled" | "error" | "syncing";

export interface StorageProviderDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: StorageProviderStatus;
  enabled: boolean;
  supportsUpload: boolean;
  supportsDownload: boolean;
  supportsSync: boolean;
  hasConfiguration: boolean;
}

export interface StorageProviderViewModel extends StorageProviderDefinition {
  lastSyncAt: string | null;
  lastSyncLabel: string;
  statusLabel: string;
}
