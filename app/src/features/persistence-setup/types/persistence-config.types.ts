export type PersistenceMode = "local" | "remote";

export interface PersistenceConfig {
  mode: PersistenceMode;
  remoteBaseUrl?: string;
  configuredAt: string;
}
