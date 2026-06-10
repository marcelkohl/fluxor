import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerErrorHandler } from "./http/error-handler.js";
import { createMariadbPersistenceProvider } from "./persistence/index.js";
import type { PersistenceProvider } from "./persistence/index.js";
import {
  registerSwagger,
  registerSwaggerUi,
} from "./plugins/swagger/index.js";
import { healthRoute } from "./routes/health.route.js";
import { statusRoute } from "./routes/status.route.js";
import { categoriesRoute } from "./routes/categories.route.js";
import { financialRecordsRoute } from "./routes/financial-records.route.js";
import { payeesRoute } from "./routes/payees.route.js";
import { walletsRoute } from "./routes/wallets.route.js";

declare module "fastify" {
  interface FastifyInstance {
    persistence: PersistenceProvider;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.decorate("persistence", createMariadbPersistenceProvider());
  registerErrorHandler(app);

  await app.register(cors, {
    origin: true,
  });

  await registerSwagger(app);
  await app.register(healthRoute);
  await app.register(statusRoute, { prefix: "/api/v1" });
  await app.register(walletsRoute, { prefix: "/api/v1/wallets" });
  await app.register(categoriesRoute, { prefix: "/api/v1/categories" });
  await app.register(payeesRoute, { prefix: "/api/v1/payees" });
  await app.register(financialRecordsRoute, {
    prefix: "/api/v1/financial-records",
  });
  await registerSwaggerUi(app);

  return app;
}
