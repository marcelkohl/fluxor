import { ensureDatabaseReady } from "@/features/database";
import { getPersistenceConfig } from "@/features/persistence-setup";

import { createRemoteApiPersistenceProvider } from "../adapters/remote-api";
import { createSqlitePersistenceProvider } from "../adapters/sqlite/sqlite-persistence.provider";
import { PersistenceNotConfiguredError } from "../errors/persistence-not-configured.error";
import { RemoteBaseUrlMissingError } from "../errors/remote-base-url-missing.error";
import type { PersistenceProvider } from "./persistence-provider.types";

export async function resolvePersistence(): Promise<PersistenceProvider> {
  const config = getPersistenceConfig();

  if (!config) {
    throw new PersistenceNotConfiguredError();
  }

  if (config.mode === "remote") {
    const remoteBaseUrl = config.remoteBaseUrl?.trim();
    if (!remoteBaseUrl) {
      throw new RemoteBaseUrlMissingError();
    }

    return createRemoteApiPersistenceProvider(remoteBaseUrl);
  }

  const db = await ensureDatabaseReady();
  return createSqlitePersistenceProvider(db);
}
