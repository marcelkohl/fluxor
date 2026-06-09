import { migration001InitialCatalog } from "./001-initial-catalog.migration";
import { migration002FinancialRecords } from "./002-financial-records.migration";
import type { MigrationDefinition } from "./migration.types";

/**
 * Registro ordenado de migrations. Sempre append — nunca reordenar versões existentes.
 */
export const MIGRATIONS_REGISTRY: readonly MigrationDefinition[] = [
  migration001InitialCatalog,
  migration002FinancialRecords,
];

export function getLatestMigrationVersion(): number {
  if (MIGRATIONS_REGISTRY.length === 0) {
    return 0;
  }
  return MIGRATIONS_REGISTRY[MIGRATIONS_REGISTRY.length - 1]!.version;
}
