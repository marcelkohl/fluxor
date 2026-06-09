import { DatabaseNotReadyError } from "../errors";
import { getDatabaseService } from "../services";
import type { SqlDatabase } from "../types";

export function requireDatabase(): SqlDatabase {
  const db = getDatabaseService().getDatabase();
  if (!db) {
    throw new DatabaseNotReadyError();
  }
  return db;
}
