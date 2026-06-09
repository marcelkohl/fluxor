import type { SqlDatabase } from "../types";
import type {
  AppliedMigrationRow,
  MigrationDefinition,
  MigrationRunResult,
} from "./migration.types";
import { MIGRATIONS_REGISTRY } from "./migrations.registry";

const SCHEMA_MIGRATION_TABLE = "schema_migration";

const CREATE_SCHEMA_MIGRATION_TABLE = `CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATION_TABLE} (
  version INTEGER PRIMARY KEY NOT NULL,
  description TEXT NOT NULL,
  appliedAt TEXT NOT NULL
)`;

async function ensureMigrationTable(db: SqlDatabase): Promise<void> {
  await db.execute(CREATE_SCHEMA_MIGRATION_TABLE);
}

async function getAppliedVersions(db: SqlDatabase): Promise<number[]> {
  const rows = await db.select<AppliedMigrationRow[]>(
    `SELECT version, description, appliedAt FROM ${SCHEMA_MIGRATION_TABLE} ORDER BY version ASC`,
  );
  return rows.map((row) => row.version);
}

async function recordMigrationApplied(
  db: SqlDatabase,
  migration: MigrationDefinition,
  appliedAt: string,
): Promise<void> {
  await db.execute(
    `INSERT INTO ${SCHEMA_MIGRATION_TABLE} (version, description, appliedAt) VALUES ($1, $2, $3)`,
    [migration.version, migration.description, appliedAt],
  );
}

async function runMigrationUp(
  db: SqlDatabase,
  migration: MigrationDefinition,
): Promise<void> {
  for (const statement of migration.up) {
    await db.execute(statement);
  }
}

/**
 * Aplica migrations pendentes em ordem de versão.
 * Idempotente: migrations já registradas em schema_migration são ignoradas.
 */
export async function runPendingMigrations(
  db: SqlDatabase,
): Promise<MigrationRunResult> {
  await ensureMigrationTable(db);

  const appliedSet = new Set(await getAppliedVersions(db));
  const applied: number[] = [];
  const skipped: number[] = [];

  const sorted = [...MIGRATIONS_REGISTRY].sort((a, b) => a.version - b.version);

  for (const migration of sorted) {
    if (appliedSet.has(migration.version)) {
      skipped.push(migration.version);
      continue;
    }

    await db.execute("BEGIN");
    try {
      await runMigrationUp(db, migration);
      await recordMigrationApplied(
        db,
        migration,
        new Date().toISOString(),
      );
      await db.execute("COMMIT");
      applied.push(migration.version);
      appliedSet.add(migration.version);
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }
  }

  return { applied, skipped };
}

export async function listAppliedMigrations(
  db: SqlDatabase,
): Promise<AppliedMigrationRow[]> {
  await ensureMigrationTable(db);
  return db.select<AppliedMigrationRow[]>(
    `SELECT version, description, appliedAt FROM ${SCHEMA_MIGRATION_TABLE} ORDER BY version ASC`,
  );
}
