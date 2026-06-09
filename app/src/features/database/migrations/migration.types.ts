/**
 * Migration versionada — ordem determinada por `version` (inteiro crescente).
 */
export interface MigrationDefinition {
  /** Número único e sequencial (1, 2, 3…) */
  version: number;
  /** Identificador legível (ex.: initial_catalog) */
  description: string;
  /** Statements SQL executados na ordem (Up) */
  up: readonly string[];
}

export interface AppliedMigrationRow {
  version: number;
  description: string;
  appliedAt: string;
}

export interface MigrationRunResult {
  applied: number[];
  skipped: number[];
}
