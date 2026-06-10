import type { PersistenceConfig } from "../types";
import { normalizeRemoteBaseUrl } from "./normalize-remote-base-url";

const STORAGE_KEY = "fluxor:persistence-config";

function isPersistenceMode(value: unknown): value is PersistenceConfig["mode"] {
  return value === "local" || value === "remote";
}

function parsePersistenceConfig(raw: string): PersistenceConfig | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistenceConfig>;

    if (!isPersistenceMode(parsed.mode)) {
      return null;
    }

    if (typeof parsed.configuredAt !== "string" || !parsed.configuredAt) {
      return null;
    }

    if (parsed.mode === "remote") {
      if (
        typeof parsed.remoteBaseUrl !== "string" ||
        !parsed.remoteBaseUrl.trim()
      ) {
        return null;
      }

      return {
        mode: "remote",
        remoteBaseUrl:
          normalizeRemoteBaseUrl(parsed.remoteBaseUrl) ?? parsed.remoteBaseUrl.trim(),
        configuredAt: parsed.configuredAt,
      };
    }

    return {
      mode: "local",
      configuredAt: parsed.configuredAt,
    };
  } catch {
    return null;
  }
}

export function getPersistenceConfig(): PersistenceConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return parsePersistenceConfig(raw);
}

export function savePersistenceConfig(
  config: Omit<PersistenceConfig, "configuredAt"> &
    Partial<Pick<PersistenceConfig, "configuredAt">>,
): PersistenceConfig {
  const next: PersistenceConfig = {
    mode: config.mode,
    configuredAt: config.configuredAt ?? new Date().toISOString(),
    ...(config.mode === "remote"
      ? {
          remoteBaseUrl: normalizeRemoteBaseUrl(config.remoteBaseUrl ?? "") ?? undefined,
        }
      : {}),
  };

  if (next.mode === "remote" && !next.remoteBaseUrl) {
    throw new Error("URL do servidor é obrigatória no modo remoto");
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetPersistenceConfig(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasPersistenceConfig(): boolean {
  return getPersistenceConfig() !== null;
}
