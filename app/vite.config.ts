import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const DEFAULT_DEV_PORT = 5173;

function readDevPort(env: Record<string, string>): number {
  const raw = env.VITE_DEV_PORT || env.PORT || String(DEFAULT_DEV_PORT);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return DEFAULT_DEV_PORT;
  }

  return port;
}

function readDevHost(env: Record<string, string>): string | boolean {
  const raw = env.VITE_DEV_HOST?.trim();
  if (!raw || raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return raw;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devPort = readDevPort(env);
  const devHost = readDevHost(env);

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@fluxor/contracts": path.resolve(
        __dirname,
        "./packages/contracts/index.ts",
      ),
    },
  },
  clearScreen: false,
  server: {
    host: devHost,
    port: devPort,
    strictPort: true,
    watch: {
      // Evita ENOSPC: builds Android/Gradle e target Rust geram milhares de arquivos.
      ignored: [
        "**/src-tauri/gen/**",
        "**/src-tauri/target/**",
        "**/dist/**",
        "**/node_modules/**",
      ],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2022",
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
};
});
