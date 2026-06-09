import type Database from "@tauri-apps/plugin-sql";

export interface DatabaseConfig {
  /** Nome do arquivo SQLite local (ex.: fluxor.db) */
  filename: string;
}

export interface DatabaseConnectionState {
  status: "idle" | "connecting" | "ready" | "error";
  message?: string;
  /** Versões de migration já aplicadas no banco */
  appliedMigrations?: number[];
  /** Versão mais recente registrada no código */
  latestMigrationVersion?: number;
}

export interface DatabaseStatus extends DatabaseConnectionState {
  connectionString: string;
  isTauri: boolean;
}

export type SqlDatabase = Database;

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  filename: "fluxor.db",
};
