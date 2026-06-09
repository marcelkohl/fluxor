import type { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { API_TAGS } from "./tags.js";

export const OPENAPI_JSON_PATH = "/api/openapi.json";
export const SWAGGER_UI_PATH = "/api/docs";

export function buildOpenApiConfig(): FastifyDynamicSwaggerOptions {
  return {
    mode: "dynamic",
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Fluxor API",
        version: "0.1.0",
        description: "API remota do Fluxor",
        contact: {
          name: "Fluxor",
        },
        license: {
          name: "Proprietary",
        },
      },
      tags: [...API_TAGS],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Reservado para autenticação futura — não implementado nesta versão.",
          },
        },
      },
      security: [],
    },
  };
}
