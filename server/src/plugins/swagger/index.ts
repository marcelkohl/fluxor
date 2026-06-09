import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import {
  buildOpenApiConfig,
  OPENAPI_JSON_PATH,
  SWAGGER_UI_PATH,
} from "./openapi.config.js";
import { registerOpenApiSchemas } from "./register-schemas.js";

/**
 * Registra @fastify/swagger e schemas compartilhados.
 * Chamar no app raiz, antes das rotas da API.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  registerOpenApiSchemas(app);
  await app.register(swagger, buildOpenApiConfig());
}

/**
 * Expõe `/api/openapi.json` e Swagger UI em `/api/docs`.
 * Chamar no app raiz, após todas as rotas documentadas.
 */
export async function registerSwaggerUi(app: FastifyInstance): Promise<void> {
  app.get(
    OPENAPI_JSON_PATH,
    {
      schema: {
        hide: true,
      },
    },
    async () => app.swagger(),
  );

  await app.register(swaggerUi, {
    routePrefix: SWAGGER_UI_PATH,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      url: OPENAPI_JSON_PATH,
    },
    staticCSP: true,
  });
}

export { OPENAPI_JSON_PATH, SWAGGER_UI_PATH } from "./openapi.config.js";
export { API_TAGS } from "./tags.js";
export {
  archiveCategoryRouteDoc,
  archiveFinancialRecordRouteDoc,
  archivePayeeRouteDoc,
  archiveWalletRouteDoc,
  createCategoryRouteDoc,
  createFinancialRecordRouteDoc,
  createPayeeRouteDoc,
  createWalletRouteDoc,
  getFinancialRecordRouteDoc,
  listFinancialRecordHistoryRouteDoc,
  listFinancialRecordsRouteDoc,
  registerPaymentRouteDoc,
  revertPaymentRouteDoc,
  getCategoryRouteDoc,
  getPayeeRouteDoc,
  listCategoriesRouteDoc,
  listPayeesRouteDoc,
  getWalletRouteDoc,
  healthRouteDoc,
  listWalletsRouteDoc,
  setDefaultWalletRouteDoc,
  statusRouteDoc,
  updateCategoryRouteDoc,
  updateFinancialRecordRouteDoc,
  updatePayeeRouteDoc,
  updateWalletRouteDoc,
} from "./schemas/index.js";
