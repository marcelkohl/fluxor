import type { FinancialRecordResponse } from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { FinancialRecordIsTransferError } from "../errors/financial-record-is-transfer.error.js";
import { FinancialRecordNotCompletedError } from "../errors/financial-record-not-completed.error.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";

export class RevertPaymentUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  async execute(id: string): Promise<FinancialRecordResponse> {
    const existing = await this.records.getById(id);
    if (!existing) {
      throw new FinancialRecordNotFoundError(id);
    }

    if (existing.storedStatus !== "completed") {
      throw new FinancialRecordNotCompletedError();
    }

    if (existing.transferGroupId) {
      throw new FinancialRecordIsTransferError();
    }

    return this.records.revertPayment(id);
  }
}
