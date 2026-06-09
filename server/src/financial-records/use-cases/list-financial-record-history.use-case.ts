import type { ListHistoryResponse } from "@fluxor/contracts";
import type { FinancialRecordHistoryRepositoryPort } from "../../persistence/ports/financial-record-history-repository.port.js";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";

export class ListFinancialRecordHistoryUseCase {
  constructor(
    private readonly records: FinancialRecordRepositoryPort,
    private readonly history: FinancialRecordHistoryRepositoryPort,
  ) {}

  async execute(recordId: string): Promise<ListHistoryResponse> {
    const record = await this.records.getById(recordId);
    if (!record) {
      throw new FinancialRecordNotFoundError(recordId);
    }

    return this.history.listByRecord(recordId);
  }
}
