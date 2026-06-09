export {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_MIGRATIONS_TABLE,
} from "./schema-version.js";
export {
  ensureMigrationsTable,
  getAppliedVersions,
  getMigrationStatus,
  listAppliedMigrations,
  runMigrations,
} from "./migrate.js";
export { MIGRATIONS_REGISTRY } from "./migrations/index.js";
export type {
  AppliedMigrationRow,
  MigrationDefinition,
  MigrationRunResult,
  MigrationStatus,
} from "./migrations/migration.types.js";
