import { isTauri } from "@tauri-apps/api/core";

import { getDatabaseService } from "./services";
import type { DatabaseStatus, SqlDatabase } from "./types";
import { DatabaseNotReadyError } from "./errors";

let initPromise: Promise<DatabaseStatus> | null = null;

/**
 * Inicializa SQLite uma vez por sessão (Tauri) ou retorna status idle no browser.
 */
export async function initializeDatabase(): Promise<DatabaseStatus> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = getDatabaseService().initialize(isTauri());

  return initPromise;
}

/** Garante banco inicializado e retorna conexão ativa. */
export async function ensureDatabaseReady(): Promise<SqlDatabase> {
  await initializeDatabase();
  const db = getDatabaseService().getDatabase();
  if (!db) {
    throw new DatabaseNotReadyError();
  }
  return db;
}
