import type {
  FinancialRecordResponse,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { FinancialRecordAlreadyCompletedError } from "../errors/financial-record-already-completed.error.js";
import { FinancialRecordIsTransferError } from "../errors/financial-record-is-transfer.error.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";
import { validateUpdateFinancialRecordInput } from "../validation/validate-financial-record-input.js";
import {
  buildBatchUpdateData,
  hasUpdateFields,
  isRecurringRecord,
  resolveRecurrenceScope,
} from "../../shared/recurrence-scope.utils.js";

async function listRecurrenceTargets(
  records: FinancialRecordRepositoryPort,
  existing: FinancialRecordResponse,
  scope: ReturnType<typeof resolveRecurrenceScope>,
): Promise<FinancialRecordResponse[]> {
  if (
    !isRecurringRecord(existing) ||
    scope === "this_only" ||
    existing.recurrenceGroupId == null ||
    existing.recurrenceIndex == null
  ) {
    return [existing];
  }

  return records.listByRecurrenceGroup(existing.recurrenceGroupId, {
    minRecurrenceIndex: existing.recurrenceIndex,
  });
}

export class UpdateFinancialRecordUseCase {
  constructor(
    private readonly persistence: PersistenceProvider,
    private readonly records: FinancialRecordRepositoryPort,
  ) {}

  async execute(
    id: string,
    data: UpdateFinancialRecordRequest,
  ): Promise<FinancialRecordResponse> {
    const { scope: requestedScope, ...updateFields } = data;

    const hasField =
      updateFields.walletId !== undefined ||
      updateFields.type !== undefined ||
      updateFields.description !== undefined ||
      updateFields.categoryId !== undefined ||
      updateFields.dueDate !== undefined ||
      updateFields.expectedAmount !== undefined ||
      updateFields.payeeId !== undefined ||
      updateFields.recordNote !== undefined ||
      updateFields.alertEnabled !== undefined ||
      updateFields.alertOffset !== undefined ||
      updateFields.transferGroupId !== undefined;

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

    if (existing.transferGroupId) {
      throw new FinancialRecordIsTransferError();
    }

    if (existing.storedStatus === "completed") {
      throw new FinancialRecordAlreadyCompletedError();
    }

    const scope = resolveRecurrenceScope(requestedScope);
    const targets = await listRecurrenceTargets(this.records, existing, scope);
    const payload =
      scope === "this_and_future" ? buildBatchUpdateData(updateFields) : updateFields;

    if (!hasUpdateFields(payload)) {
      throw new FinancialRecordValidationError(
        "no_fields_to_update",
        "At least one field must be provided",
      );
    }

    await validateUpdateFinancialRecordInput(this.persistence, payload);

    let lastUpdated = existing;

    for (const target of targets) {
      if (target.transferGroupId) {
        continue;
      }

      if (target.storedStatus === "completed") {
        continue;
      }

      lastUpdated = await this.records.update(target.id, payload);

      await this.persistence.financialRecordHistory.appendEvent({
        recordId: lastUpdated.id,
        eventType: "record_updated",
        description: "Registro alterado",
      });
    }

    return lastUpdated;
  }
}
