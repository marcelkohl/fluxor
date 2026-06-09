import type {
  CreateFinancialRecordRequest,
  FinancialRecordResponse,
} from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { validateCreateFinancialRecordInput } from "../validation/validate-financial-record-input.js";

export class CreateFinancialRecordUseCase {
  constructor(
    private readonly persistence: PersistenceProvider,
    private readonly records: FinancialRecordRepositoryPort,
  ) {}

  async execute(
    data: CreateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse> {
    await validateCreateFinancialRecordInput(this.persistence, data);
    const record = await this.records.create(data);

    await this.persistence.financialRecordHistory.appendEvent({
      recordId: record.id,
      eventType: "record_created",
      description: "Registro criado",
    });

    return record;
  }
}
