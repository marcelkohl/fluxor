import { normalizeRemoteBaseUrl } from "./normalize-remote-base-url";

export type RemoteServerTestOutcome =
  | "success"
  | "connection_failed"
  | "database_unavailable"
  | "invalid_api"
  | "invalid_url";

export interface RemoteServerTestDetails {
  healthOk: boolean;
  statusRunning: boolean;
  databaseConfigured: boolean;
  databaseConnected: boolean;
}

export interface RemoteServerTestResult {
  outcome: RemoteServerTestOutcome;
  message: string;
  normalizedUrl?: string;
  details?: RemoteServerTestDetails;
}

interface HealthResponse {
  ok?: boolean;
}

interface StatusResponse {
  status?: string;
  database?: {
    configured?: boolean;
    connected?: boolean;
  };
}

async function fetchJson<T>(url: string): Promise<
  | { ok: true; data: T }
  | { ok: false; status?: number }
> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

export async function testRemoteServerConnection(
  rawUrl: string,
): Promise<RemoteServerTestResult> {
  const normalizedUrl = normalizeRemoteBaseUrl(rawUrl);
  if (!normalizedUrl) {
    return {
      outcome: "invalid_url",
      message: "URL do servidor inválida.",
    };
  }

  const healthResult = await fetchJson<HealthResponse>(
    `${normalizedUrl}/health`,
  );

  if (!healthResult.ok) {
    return {
      outcome: "connection_failed",
      message:
        "Não foi possível conectar ao servidor.\nVerifique a URL informada.",
      normalizedUrl,
      details: {
        healthOk: false,
        statusRunning: false,
        databaseConfigured: false,
        databaseConnected: false,
      },
    };
  }

  if (healthResult.data.ok !== true) {
    return {
      outcome: "connection_failed",
      message:
        "Não foi possível conectar ao servidor.\nVerifique a URL informada.",
      normalizedUrl,
      details: {
        healthOk: false,
        statusRunning: false,
        databaseConfigured: false,
        databaseConnected: false,
      },
    };
  }

  const statusResult = await fetchJson<StatusResponse>(
    `${normalizedUrl}/api/v1/status`,
  );

  if (!statusResult.ok || statusResult.data.status !== "running") {
    return {
      outcome: "invalid_api",
      message:
        "Servidor encontrado, mas não parece ser uma API Fluxor válida.",
      normalizedUrl,
      details: {
        healthOk: true,
        statusRunning: false,
        databaseConfigured: false,
        databaseConnected: false,
      },
    };
  }

  const database = statusResult.data.database;
  const databaseConfigured = database?.configured === true;
  const databaseConnected = database?.connected === true;

  if (!databaseConfigured || !databaseConnected) {
    return {
      outcome: "database_unavailable",
      message:
        "Servidor respondeu, mas o banco remoto não está conectado.",
      normalizedUrl,
      details: {
        healthOk: true,
        statusRunning: true,
        databaseConfigured,
        databaseConnected,
      },
    };
  }

  return {
    outcome: "success",
    message:
      "Conexão bem-sucedida.\nServidor Fluxor encontrado.\nBanco conectado.",
    normalizedUrl,
    details: {
      healthOk: true,
      statusRunning: true,
      databaseConfigured: true,
      databaseConnected: true,
    },
  };
}
