import type { FastifyPluginAsync } from "fastify";
import { healthRouteDoc } from "../plugins/swagger/index.js";

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get("/health", { schema: healthRouteDoc }, async () => ({ ok: true }));
};
