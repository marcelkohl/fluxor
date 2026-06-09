import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { ApiErrorResponse } from "@fluxor/contracts";
import { CategoryNotFoundError } from "../categories/errors/category-not-found.error.js";
import { CategoryValidationError } from "../categories/errors/category-validation.error.js";
import { FinancialRecordAlreadyCompletedError } from "../financial-records/errors/financial-record-already-completed.error.js";
import { FinancialRecordCanceledError } from "../financial-records/errors/financial-record-canceled.error.js";
import { FinancialRecordIsTransferError } from "../financial-records/errors/financial-record-is-transfer.error.js";
import { FinancialRecordNotCompletedError } from "../financial-records/errors/financial-record-not-completed.error.js";
import { FinancialRecordNotFoundError } from "../financial-records/errors/financial-record-not-found.error.js";
import { FinancialRecordValidationError } from "../financial-records/errors/financial-record-validation.error.js";
import { PayeeNotFoundError } from "../payees/errors/payee-not-found.error.js";
import { PayeeValidationError } from "../payees/errors/payee-validation.error.js";
import { WalletNotFoundError } from "../wallets/errors/wallet-not-found.error.js";
import { WalletValidationError } from "../wallets/errors/wallet-validation.error.js";

function sendError(
  reply: FastifyReply,
  statusCode: number,
  body: ApiErrorResponse,
): void {
  reply.status(statusCode).send(body);
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof WalletNotFoundError) {
        sendError(reply, 404, {
          code: "wallet_not_found",
          message: "Wallet not found",
        });
        return;
      }

      if (error instanceof CategoryNotFoundError) {
        sendError(reply, 404, {
          code: "category_not_found",
          message: "Category not found",
        });
        return;
      }

      if (error instanceof PayeeNotFoundError) {
        sendError(reply, 404, {
          code: "payee_not_found",
          message: "Payee not found",
        });
        return;
      }

      if (error instanceof FinancialRecordNotFoundError) {
        sendError(reply, 404, {
          code: "financial_record_not_found",
          message: "Financial record not found",
        });
        return;
      }

      if (error instanceof FinancialRecordAlreadyCompletedError) {
        sendError(reply, 409, {
          code: "financial_record_already_completed",
          message: "Record is already completed",
        });
        return;
      }

      if (error instanceof FinancialRecordNotCompletedError) {
        sendError(reply, 409, {
          code: "financial_record_not_completed",
          message: "Record is not completed",
        });
        return;
      }

      if (error instanceof FinancialRecordIsTransferError) {
        sendError(reply, 400, {
          code: "financial_record_is_transfer",
          message: "Transfer records use a dedicated flow",
        });
        return;
      }

      if (error instanceof FinancialRecordCanceledError) {
        sendError(reply, 400, {
          code: "validation_error",
          message: "Record is canceled",
        });
        return;
      }

      if (
        error instanceof WalletValidationError ||
        error instanceof CategoryValidationError ||
        error instanceof PayeeValidationError ||
        error instanceof FinancialRecordValidationError
      ) {
        sendError(reply, 400, {
          code: error.code,
          message: error.message,
        });
        return;
      }

      if (error.validation) {
        sendError(reply, 400, {
          code: "validation_error",
          message: error.message,
        });
        return;
      }

      reply.send(error);
    },
  );
}
