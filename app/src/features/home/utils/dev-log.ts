import type { PersistenceConfig } from "@/features/persistence-setup";

export function logRemoteDev(
  label: string,
  payload: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug(`[Fluxor DEV] ${label}`, payload);
}

export function getDevProviderLabel(
  config: PersistenceConfig | null,
): string {
  if (!config) {
    return "não configurado";
  }
  return config.mode === "remote" ? "Remoto" : "Local";
}
