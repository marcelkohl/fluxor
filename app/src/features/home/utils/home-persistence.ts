import { isTauri } from "@tauri-apps/api/core";

import { getPersistenceConfig } from "@/features/persistence-setup";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** IDs reais da API / SQLite usam UUID. */
export function isValidEntityId(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Dados mock da Home só quando o browser não tem provider real (demo legado).
 * Modo Remoto e Local (Tauri) sempre usam use cases / provider ativo.
 */
export function shouldUseHomeMocks(): boolean {
  const config = getPersistenceConfig();
  if (config?.mode === "remote") {
    return false;
  }
  return !isTauri();
}
