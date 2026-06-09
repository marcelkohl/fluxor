import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";
import { statusRouteDoc } from "../plugins/swagger/index.js";
import {
  checkDatabaseConnection,
  isDatabaseConfigured,
} from "../persistence/index.js";

export const statusRoute: FastifyPluginAsync = async (app) => {
  app.get("/status", { schema: statusRouteDoc }, async () => {
    const configured = isDatabaseConfigured();
    const connected = configured ? await checkDatabaseConnection() : false;

    return {
      name: "fluxor-server",
      version: "0.1.0",
      status: "running",
      environment: env.NODE_ENV,
      database: {
        configured,
        connected,
        ...(configured
          ? {
              host: env.db.host,
              port: env.db.port,
              name: env.db.name,
            }
          : {}),
      },
    };
  });
};
