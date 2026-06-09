import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { getPool } from "../persistence/adapters/mariadb/connection.js";
import { MIGRATIONS_REGISTRY } from "./migrations/index.js";
import type {
  AppliedMigrationRow,
  MigrationDefinition,
  MigrationRunResult,
  MigrationStatus,
} from "./migrations/migration.types.js";
import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_MIGRATIONS_TABLE,
} from "./schema-version.js";

interface MigrationVersionRow extends RowDataPacket {
  version: number;
}

interface AppliedMigrationDbRow extends RowDataPacket {
  version: number;
  name: string;
  appliedAt: Date;
}

const CREATE_SCHEMA_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE} (
  version INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  appliedAt DATETIME(3) NOT NULL,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(CREATE_SCHEMA_MIGRATIONS_TABLE);
}

export async function getAppliedVersions(pool: Pool): Promise<number[]> {
  const [rows] = await pool.query<MigrationVersionRow[]>(
    `SELECT version FROM ${SCHEMA_MIGRATIONS_TABLE} ORDER BY version ASC`,
  );
  return rows.map((row) => row.version);
}

export async function listAppliedMigrations(
  pool: Pool,
): Promise<AppliedMigrationRow[]> {
  await ensureMigrationsTable(pool);

  const [rows] = await pool.query<AppliedMigrationDbRow[]>(
    `SELECT version, name, appliedAt
     FROM ${SCHEMA_MIGRATIONS_TABLE}
     ORDER BY version ASC`,
  );

  return rows.map((row) => ({
    version: row.version,
    name: row.name,
    appliedAt: row.appliedAt,
  }));
}

async function recordMigrationApplied(
  connection: PoolConnection,
  migration: MigrationDefinition,
  appliedAt: Date,
): Promise<void> {
  await connection.query(
    `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (version, name, appliedAt)
     VALUES (?, ?, ?)`,
    [migration.version, migration.name, appliedAt],
  );
}

async function runMigrationUp(
  connection: PoolConnection,
  migration: MigrationDefinition,
): Promise<void> {
  for (const statement of migration.up) {
    await connection.query(statement);
  }
}

/**
 * Aplica migrations pendentes em ordem de versão.
 * Idempotente: versões já registradas em schema_migrations são ignoradas.
 */
export async function runMigrations(pool = getPool()): Promise<MigrationRunResult> {
  await ensureMigrationsTable(pool);

  const appliedSet = new Set(await getAppliedVersions(pool));
  const applied: number[] = [];
  const skipped: number[] = [];

  const sorted = [...MIGRATIONS_REGISTRY].sort((a, b) => a.version - b.version);

  for (const migration of sorted) {
    if (appliedSet.has(migration.version)) {
      skipped.push(migration.version);
      continue;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await runMigrationUp(connection, migration);
      await recordMigrationApplied(connection, migration, new Date());
      await connection.commit();
      applied.push(migration.version);
      appliedSet.add(migration.version);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return { applied, skipped };
}

export async function getMigrationStatus(
  pool = getPool(),
): Promise<MigrationStatus> {
  const applied = await listAppliedMigrations(pool);
  const appliedVersions = new Set(applied.map((row) => row.version));
  const pending = MIGRATIONS_REGISTRY.map((migration) => migration.version).filter(
    (version) => !appliedVersions.has(version),
  );

  return {
    currentSchemaVersion: CURRENT_SCHEMA_VERSION,
    applied,
    pending,
  };
}
