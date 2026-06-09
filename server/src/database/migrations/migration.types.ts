export interface MigrationDefinition {
  version: number;
  name: string;
  up: readonly string[];
}

export interface AppliedMigrationRow {
  version: number;
  name: string;
  appliedAt: Date;
}

export interface MigrationRunResult {
  applied: number[];
  skipped: number[];
}

export interface MigrationStatus {
  currentSchemaVersion: number;
  applied: AppliedMigrationRow[];
  pending: number[];
}
