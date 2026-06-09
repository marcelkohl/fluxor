import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { devUrl } from "./dev-env.mjs";

const args = process.argv.slice(2);
const needsDevUrl =
  args[0] === "dev" || (args[0] === "android" && args[1] === "dev");

const tauriBin = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../node_modules/.bin/tauri",
);

const finalArgs = needsDevUrl
  ? [...args, "--config", JSON.stringify({ build: { devUrl } })]
  : args;

const child = spawn(tauriBin, finalArgs, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
