import { migration001InitialSchema } from "./001_initial_schema.js";
import type { MigrationDefinition } from "./migration.types.js";

export const MIGRATIONS_REGISTRY: readonly MigrationDefinition[] = [
  migration001InitialSchema,
];

export type {
  AppliedMigrationRow,
  MigrationDefinition,
  MigrationRunResult,
  MigrationStatus,
} from "./migration.types.js";
