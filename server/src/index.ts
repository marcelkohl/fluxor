import { buildApp } from "./app.js";
import { closePool } from "./persistence/index.js";
import { startServer } from "./server.js";

const app = await buildApp();

async function shutdown() {
  await app.close();
  await closePool();
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

await startServer(app);
