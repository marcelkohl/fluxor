import { ensureDatabaseReady } from "@/features/database";
import {
  getPersistenceConfig,
} from "@/features/persistence-setup";

import { createSqlitePersistenceProvider } from "../adapters/sqlite/sqlite-persistence.provider";
import { PersistenceNotConfiguredError } from "../errors/persistence-not-configured.error";
import { RemoteProviderNotImplementedError } from "../errors/remote-provider-not-implemented.error";
import type { PersistenceProvider } from "./persistence-provider.types";

export async function resolvePersistence(): Promise<PersistenceProvider> {
  const config = getPersistenceConfig();

  if (!config) {
    throw new PersistenceNotConfiguredError();
  }

  if (config.mode === "remote") {
    throw new RemoteProviderNotImplementedError();
  }

  const db = await ensureDatabaseReady();
  return createSqlitePersistenceProvider(db);
}
