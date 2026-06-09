import Database from "@tauri-apps/plugin-sql";

import {
  getLatestMigrationVersion,
  runPendingMigrations,
} from "../migrations";
import type {
  DatabaseConfig,
  DatabaseConnectionState,
  DatabaseStatus,
  SqlDatabase,
} from "../types";
import { DEFAULT_DATABASE_CONFIG } from "../types";

export class DatabaseService {
  private db: SqlDatabase | null = null;
  private state: DatabaseConnectionState = { status: "idle" };

  constructor(private readonly config: DatabaseConfig = DEFAULT_DATABASE_CONFIG) {}

  getConnectionString(): string {
    return `sqlite:${this.config.filename}`;
  }

  getState(): DatabaseConnectionState {
    return { ...this.state };
  }

  getStatus(isTauri: boolean): DatabaseStatus {
    return {
      ...this.getState(),
      connectionString: this.getConnectionString(),
      isTauri,
    };
  }

  /** Conexão ativa após initialize(); null se ainda não conectado. */
  getDatabase(): SqlDatabase | null {
    return this.db;
  }

  /**
   * Abre conexão SQLite, aplica migrations pendentes e atualiza status.
   * No browser (fora do Tauri), retorna status idle com mensagem informativa.
   */
  async initialize(isTauri: boolean): Promise<DatabaseStatus> {
    if (!isTauri) {
      this.state = {
        status: "idle",
        message: "SQLite disponível apenas no runtime Tauri",
        latestMigrationVersion: getLatestMigrationVersion(),
      };
      return this.getStatus(false);
    }

    this.state = { status: "connecting" };

    try {
      this.db = await Database.load(this.getConnectionString());
      await this.db.execute("PRAGMA foreign_keys = ON");
      const { applied, skipped } = await runPendingMigrations(this.db);

      const appliedMigrations = [...skipped, ...applied].sort((a, b) => a - b);

      this.state = {
        status: "ready",
        message:
          applied.length > 0
            ? `Migrations aplicadas: ${applied.join(", ")}`
            : "Banco pronto",
        appliedMigrations,
        latestMigrationVersion: getLatestMigrationVersion(),
      };

      return this.getStatus(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao inicializar SQLite";

      this.db = null;
      this.state = {
        status: "error",
        message,
        latestMigrationVersion: getLatestMigrationVersion(),
      };

      return this.getStatus(true);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    this.state = { status: "idle" };
  }
}

let singleton: DatabaseService | null = null;

export function getDatabaseService(
  config?: DatabaseConfig,
): DatabaseService {
  if (!singleton) {
    singleton = new DatabaseService(config);
  }
  return singleton;
}

export function resetDatabaseServiceForTests(): void {
  singleton = null;
}
