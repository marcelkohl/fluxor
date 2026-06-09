import { config as loadDotenv } from "dotenv";

loadDotenv();

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_NODE_ENV = "development";

const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_NAME = "fluxor";
const DEFAULT_DB_USER = "fluxor";

function readPort(rawValue: string | undefined, fallback: number): number {
  const raw = rawValue ?? String(fallback);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }

  return port;
}

export const env = {
  PORT: readPort(process.env.PORT, DEFAULT_PORT),
  HOST: process.env.HOST ?? DEFAULT_HOST,
  NODE_ENV: process.env.NODE_ENV ?? DEFAULT_NODE_ENV,
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: readPort(process.env.DB_PORT, DEFAULT_DB_PORT),
    name: process.env.DB_NAME ?? DEFAULT_DB_NAME,
    user: process.env.DB_USER ?? DEFAULT_DB_USER,
    password: process.env.DB_PASSWORD ?? "",
  },
} as const;
