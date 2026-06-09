import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PORT = 5173;

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const vars = {};

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

const fileEnv = {
  ...loadDotEnv(resolve(root, ".env")),
  ...loadDotEnv(resolve(root, ".env.local")),
};

const merged = { ...fileEnv, ...process.env };
const raw = merged.VITE_DEV_PORT ?? merged.PORT ?? String(DEFAULT_PORT);
const parsed = Number(raw);

export const devPort =
  Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535
    ? parsed
    : DEFAULT_PORT;

export const devUrl = `http://localhost:${devPort}`;
