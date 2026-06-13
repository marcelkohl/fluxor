import type { CreateRecurringFinancialRecordsResponse } from "@fluxor/contracts";

import { RemoteBaseUrlMissingError } from "@/features/persistence/errors/remote-base-url-missing.error";
import { getPersistenceConfig } from "@/features/persistence-setup";

import { RemoteApiClient } from "@/features/persistence/adapters/remote-api/remote-api.client";

import type { CreateRecurringFinancialRecordsInput } from "../application/create-recurring-financial-records";
import type { CreateRecurringFinancialRecordsResult } from "../application/create-recurring-financial-records";

export async function createRecurringFinancialRecordsRemote(
  input: CreateRecurringFinancialRecordsInput,
): Promise<CreateRecurringFinancialRecordsResult> {
  const config = getPersistenceConfig();
  const remoteBaseUrl = config?.remoteBaseUrl?.trim();

  if (!remoteBaseUrl) {
    throw new RemoteBaseUrlMissingError();
  }

  const client = new RemoteApiClient(remoteBaseUrl);
  const response = await client.request<CreateRecurringFinancialRecordsResponse>(
    "/financial-records/recurring",
    {
      method: "POST",
      body: JSON.stringify({
        record: {
          walletId: input.record.walletId,
          type: input.record.type,
          description: input.record.description,
          categoryId: input.record.categoryId,
          dueDate: input.record.dueDate,
          expectedAmount: input.record.expectedAmount,
          payeeId: input.record.payeeId ?? null,
          recordNote: input.record.recordNote ?? null,
          alertEnabled: input.record.alertEnabled ?? false,
          alertOffset: input.record.alertOffset ?? null,
        },
        recurrence: input.recurrence,
      }),
    },
  );

  return {
    batchId: response.batchId,
    records: response.records,
  };
}
