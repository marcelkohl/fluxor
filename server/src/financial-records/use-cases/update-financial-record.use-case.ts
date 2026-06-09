import type {
  FinancialRecordResponse,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";
import { validateUpdateFinancialRecordInput } from "../validation/validate-financial-record-input.js";

export class UpdateFinancialRecordUseCase {
  constructor(
    private readonly persistence: PersistenceProvider,
    private readonly records: FinancialRecordRepositoryPort,
  ) {}

  async execute(
    id: string,
    data: UpdateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse> {
    const hasField =
      data.description !== undefined ||
      data.categoryId !== undefined ||
      data.dueDate !== undefined ||
      data.expectedAmount !== undefined ||
      data.payeeId !== undefined ||
      data.recordNote !== undefined ||
      data.alertEnabled !== undefined ||
      data.alertOffset !== undefined ||
      data.transferGroupId !== undefined;

    if (!hasField) {
      throw new FinancialRecordValidationError(
        "no_fields_to_update",
        "At least one field must be provided",
      );
    }

    const existing = await this.records.getById(id);
    if (!existing) {
      throw new FinancialRecordNotFoundError(id);
    }

    await validateUpdateFinancialRecordInput(this.persistence, data);
    const updated = await this.records.update(id, data);

    await this.persistence.financialRecordHistory.appendEvent({
      recordId: updated.id,
      eventType: "record_updated",
      description: "Registro alterado",
    });

    return updated;
  }
}
