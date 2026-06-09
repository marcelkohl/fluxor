import type { FinancialRecordResponse } from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";

export class ArchiveFinancialRecordUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  execute(id: string): Promise<FinancialRecordResponse> {
    return this.records.archive(id);
  }
}
