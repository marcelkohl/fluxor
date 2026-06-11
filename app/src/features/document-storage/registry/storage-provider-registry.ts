import { getProviderLastSyncAt } from "../services/storage-provider-state.service";
import {
  formatLastSyncLabel,
  formatStorageProviderStatusLabel,
} from "../utils/format-last-sync";
import { googleDriveProviderDefinition } from "./definitions/google-drive.definition";
import { localStorageProviderDefinition } from "./definitions/local-storage.definition";
import type {
  StorageProviderDefinition,
  StorageProviderViewModel,
} from "./storage-provider-registry.types";

const STORAGE_PROVIDER_DEFINITIONS: StorageProviderDefinition[] = [
  localStorageProviderDefinition,
  googleDriveProviderDefinition,
];

function toViewModel(
  definition: StorageProviderDefinition,
): StorageProviderViewModel {
  const lastSyncAt = getProviderLastSyncAt(definition.id);

  return {
    ...definition,
    lastSyncAt,
    lastSyncLabel: formatLastSyncLabel(lastSyncAt),
    statusLabel: formatStorageProviderStatusLabel(definition.status),
  };
}

export class StorageProviderRegistry {
  static list(): StorageProviderViewModel[] {
    return STORAGE_PROVIDER_DEFINITIONS.map(toViewModel);
  }

  static getById(providerId: string): StorageProviderViewModel | null {
    const definition = STORAGE_PROVIDER_DEFINITIONS.find(
      (item) => item.id === providerId,
    );

    return definition ? toViewModel(definition) : null;
  }
}
