import type { PersistenceMode } from "../types";

export function getPersistenceModeLabel(mode: PersistenceMode): string {
  return mode === "local" ? "Local" : "Remoto";
}
