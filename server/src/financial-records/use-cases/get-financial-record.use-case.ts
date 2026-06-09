import type { FinancialRecordResponse } from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";

export class GetFinancialRecordUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  async execute(id: string): Promise<FinancialRecordResponse> {
    const record = await this.records.getById(id);
    if (!record) {
      throw new FinancialRecordNotFoundError(id);
    }

    return record;
  }
}
