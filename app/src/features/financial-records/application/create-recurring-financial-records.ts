import { ValidationError } from "@/features/database";
import { getPersistenceConfig } from "@/features/persistence-setup";
import { resolvePersistence } from "@/features/persistence";
import type { RecurrenceRule } from "@fluxor/contracts";

import type { FinancialRecord, FinancialRecordType } from "../domain";
import { formatRecurrenceRuleSummary } from "../utils/format-recurrence-rule-summary";
import {
  generateRecurringDueDates,
  validateRecurrenceRule,
} from "../utils/generate-recurring-due-dates";
import type { CreateFinancialRecordInput } from "./financial-record.use-cases";
import { validateCreateFinancialRecordReferences } from "./financial-record.use-cases";
import { createRecurringFinancialRecordsRemote } from "../adapters/remote-create-recurring-financial-records";

export interface CreateRecurringFinancialRecordsInput {
  record: CreateFinancialRecordInput;
  recurrence: RecurrenceRule;
}

export interface CreateRecurringFinancialRecordsResult {
  batchId: string;
  records: FinancialRecord[];
}

function assertValidRecurrenceRule(rule: RecurrenceRule): void {
  try {
    validateRecurrenceRule(rule);
  } catch (error) {
    throw new ValidationError(
      error instanceof Error ? error.message : "Regra de recorrência inválida",
    );
  }
}

async function createRecurringFinancialRecordsLocal(
  input: CreateRecurringFinancialRecordsInput,
): Promise<CreateRecurringFinancialRecordsResult> {
  await validateCreateFinancialRecordReferences(input.record);
  assertValidRecurrenceRule(input.recurrence);

  const persistence = await resolvePersistence();
  const { recurrenceBatches, financialRecords, financialRecordHistory } =
    persistence;

  const dueDates = generateRecurringDueDates(
    input.record.dueDate,
    input.recurrence,
  );

  if (dueDates.length < 2) {
    throw new ValidationError(
      "A recorrência deve gerar pelo menos 2 ocorrências",
    );
  }

  const ruleDescription = formatRecurrenceRuleSummary(
    input.recurrence,
    input.record.dueDate,
  );

  const batch = await recurrenceBatches.create({
    ruleDescription,
    startDate: dueDates[0],
    endDate: dueDates[dueDates.length - 1],
    occurrenceCount: dueDates.length,
  });

  const records: FinancialRecord[] = [];

  for (let index = 0; index < dueDates.length; index += 1) {
    const record = await financialRecords.create({
      walletId: input.record.walletId,
      type: input.record.type as FinancialRecordType,
      description: input.record.description,
      categoryId: input.record.categoryId,
      dueDate: dueDates[index],
      expectedAmount: input.record.expectedAmount,
      payeeId: input.record.payeeId ?? null,
      recordNote: input.record.recordNote ?? null,
      alertEnabled: input.record.alertEnabled ?? false,
      alertOffset: input.record.alertOffset ?? null,
      storedStatus: "pending",
      recurrenceGroupId: batch.id,
      recurrenceIndex: index + 1,
    });

    await financialRecordHistory.appendEvent({
      recordId: record.id,
      eventType: "record_created",
      description: "Registro criado",
    });

    records.push(record);
  }

  return {
    batchId: batch.id,
    records,
  };
}

export async function createRecurringFinancialRecords(
  input: CreateRecurringFinancialRecordsInput,
): Promise<CreateRecurringFinancialRecordsResult> {
  assertValidRecurrenceRule(input.recurrence);

  const config = getPersistenceConfig();
  if (config?.mode === "remote") {
    await validateCreateFinancialRecordReferences(input.record);
    return createRecurringFinancialRecordsRemote(input);
  }

  return createRecurringFinancialRecordsLocal(input);
}
