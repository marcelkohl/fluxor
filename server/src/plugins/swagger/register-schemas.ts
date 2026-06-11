import type { FastifyInstance } from "fastify";
import { healthResponseSchema } from "./schemas/health.schemas.js";
import {
  databaseStatusSchema,
  statusResponseSchema,
} from "./schemas/status.schemas.js";
import {
  attachmentResponseSchema,
  createAttachmentRequestSchema,
  listAttachmentsResponseSchema,
} from "./schemas/attachments.schemas.js";
import {
  categoryResponseSchema,
  createCategoryRequestSchema,
  listCategoriesResponseSchema,
  updateCategoryRequestSchema,
} from "./schemas/categories.schemas.js";
import {
  financialRecordHistoryResponseSchema,
  listHistoryResponseSchema,
} from "./schemas/history.schemas.js";
import {
  createFinancialRecordRequestSchema,
  financialRecordResponseSchema,
  listFinancialRecordsResponseSchema,
  registerPaymentRequestSchema,
  revertPaymentRequestSchema,
  updateFinancialRecordRequestSchema,
} from "./schemas/financial-records.schemas.js";
import {
  createPayeeRequestSchema,
  listPayeesResponseSchema,
  payeeResponseSchema,
  updatePayeeRequestSchema,
} from "./schemas/payees.schemas.js";
import {
  apiErrorResponseSchema,
  createWalletRequestSchema,
  listWalletsResponseSchema,
  paginationResponseSchema,
  updateWalletRequestSchema,
  walletResponseSchema,
} from "./schemas/wallets.schemas.js";

/** Registra JSON Schemas reutilizáveis (OpenAPI components). */
export function registerOpenApiSchemas(app: FastifyInstance): void {
  app.addSchema(healthResponseSchema);
  app.addSchema(databaseStatusSchema);
  app.addSchema(statusResponseSchema);
  app.addSchema(walletResponseSchema);
  app.addSchema(createWalletRequestSchema);
  app.addSchema(updateWalletRequestSchema);
  app.addSchema(paginationResponseSchema);
  app.addSchema(listWalletsResponseSchema);
  app.addSchema(apiErrorResponseSchema);
  app.addSchema(categoryResponseSchema);
  app.addSchema(createCategoryRequestSchema);
  app.addSchema(updateCategoryRequestSchema);
  app.addSchema(listCategoriesResponseSchema);
  app.addSchema(payeeResponseSchema);
  app.addSchema(createPayeeRequestSchema);
  app.addSchema(updatePayeeRequestSchema);
  app.addSchema(listPayeesResponseSchema);
  app.addSchema(financialRecordResponseSchema);
  app.addSchema(createFinancialRecordRequestSchema);
  app.addSchema(updateFinancialRecordRequestSchema);
  app.addSchema(listFinancialRecordsResponseSchema);
  app.addSchema(registerPaymentRequestSchema);
  app.addSchema(revertPaymentRequestSchema);
  app.addSchema(financialRecordHistoryResponseSchema);
  app.addSchema(listHistoryResponseSchema);
  app.addSchema(attachmentResponseSchema);
  app.addSchema(createAttachmentRequestSchema);
  app.addSchema(listAttachmentsResponseSchema);
}
