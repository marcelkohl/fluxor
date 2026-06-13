import type { RecurrenceBatchResponse } from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { RecurrenceBatchRepositoryPort } from "@/features/persistence/ports";
import type {
  CreateRecurrenceBatchData,
  RecurrenceBatch,
} from "@/features/financial-records/domain";

import { RemoteFeatureNotSupportedError } from "@/features/persistence/errors/remote-feature-not-supported.error";
import type { RemoteApiClient } from "./remote-api.client";

export class RemoteRecurrenceBatchRepository
  implements RecurrenceBatchRepositoryPort
{
  constructor(private readonly client: RemoteApiClient) {}

  async create(_data: CreateRecurrenceBatchData): Promise<RecurrenceBatch> {
    throw new RemoteFeatureNotSupportedError("recurrenceBatches.create");
  }

  async getById(id: string): Promise<RecurrenceBatch | null> {
    try {
      return await this.client.request<RecurrenceBatchResponse>(
        `/recurrence-batches/${id}`,
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
