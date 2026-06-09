import type {
  FinancialRecordResponse,
  RegisterPaymentRequest,
} from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { isValidIsoDate } from "../../shared/datetime.js";
import { FinancialRecordAlreadyCompletedError } from "../errors/financial-record-already-completed.error.js";
import { FinancialRecordIsTransferError } from "../errors/financial-record-is-transfer.error.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";

export class RegisterPaymentUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  async execute(
    id: string,
    data: RegisterPaymentRequest,
  ): Promise<FinancialRecordResponse> {
    const existing = await this.records.getById(id);
    if (!existing) {
      throw new FinancialRecordNotFoundError(id);
    }

    if (existing.storedStatus === "completed") {
      throw new FinancialRecordAlreadyCompletedError();
    }

    if (existing.transferGroupId) {
      throw new FinancialRecordIsTransferError();
    }

    if (!isValidIsoDate(data.effectiveDate)) {
      throw new FinancialRecordValidationError(
        "invalid_date",
        "effectiveDate must be a valid ISO date (YYYY-MM-DD)",
      );
    }

    if (!Number.isInteger(data.effectiveAmount) || data.effectiveAmount <= 0) {
      throw new FinancialRecordValidationError(
        "invalid_amount",
        "effectiveAmount must be a positive integer",
      );
    }

    return this.records.registerPayment(id, data);
  }
}
