const STORAGE_KEY = "fluxor:storage-provider-state";

type ProviderStateMap = Record<string, { lastSyncAt: string | null }>;

interface StorageProviderStateFile {
  providers: ProviderStateMap;
}

function createDefaultState(): StorageProviderStateFile {
  return { providers: {} };
}

function readState(): StorageProviderStateFile {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as StorageProviderStateFile;
    if (!parsed || typeof parsed !== "object" || !parsed.providers) {
      return createDefaultState();
    }
    return parsed;
  } catch {
    return createDefaultState();
  }
}

function writeState(state: StorageProviderStateFile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getProviderLastSyncAt(providerId: string): string | null {
  return readState().providers[providerId]?.lastSyncAt ?? null;
}

export function setProviderLastSyncAt(
  providerId: string,
  lastSyncAt: string | null,
): void {
  const state = readState();
  state.providers[providerId] = { lastSyncAt };
  writeState(state);
}
