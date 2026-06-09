import type { FastifyInstance } from "fastify";
import { env } from "./config/env.js";

export async function startServer(app: FastifyInstance) {
  await app.listen({ port: env.PORT, host: env.HOST });
}
