import type { FinancialRecordResponse, RecurrenceScope } from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { FinancialRecordIsTransferError } from "../errors/financial-record-is-transfer.error.js";
import { FinancialRecordNotFoundError } from "../errors/financial-record-not-found.error.js";
import {
  isRecurringRecord,
  resolveRecurrenceScope,
} from "../../shared/recurrence-scope.utils.js";

async function listRecurrenceTargets(
  records: FinancialRecordRepositoryPort,
  existing: FinancialRecordResponse,
  scope: RecurrenceScope,
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

export class ArchiveFinancialRecordUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  async execute(
    id: string,
    scope?: RecurrenceScope,
  ): Promise<FinancialRecordResponse> {
    const existing = await this.records.getById(id);
    if (!existing) {
      throw new FinancialRecordNotFoundError(id);
    }

    if (existing.transferGroupId) {
      throw new FinancialRecordIsTransferError();
    }

    const resolvedScope = resolveRecurrenceScope(scope);
    const targets = await listRecurrenceTargets(
      this.records,
      existing,
      resolvedScope,
    );

    let lastArchived = existing;

    for (const target of targets) {
      if (target.transferGroupId) {
        continue;
      }

      lastArchived = await this.records.archive(target.id);
    }

    return lastArchived;
  }
}
