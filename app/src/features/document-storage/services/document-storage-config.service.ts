const STORAGE_KEY = "fluxor:document-storage-config";

export interface DocumentStorageConfig {
  rootFolderPath: string;
  configuredAt: string;
}

function isDocumentStorageConfig(value: unknown): value is DocumentStorageConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as DocumentStorageConfig;
  return (
    typeof config.rootFolderPath === "string" &&
    config.rootFolderPath.trim().length > 0 &&
    typeof config.configuredAt === "string"
  );
}

export function getDocumentStorageConfig(): DocumentStorageConfig | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isDocumentStorageConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDocumentStorageConfig(
  rootFolderPath: string,
): DocumentStorageConfig {
  const next: DocumentStorageConfig = {
    rootFolderPath: rootFolderPath.trim(),
    configuredAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetDocumentStorageConfig(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasDocumentStorageConfig(): boolean {
  return getDocumentStorageConfig() != null;
}
