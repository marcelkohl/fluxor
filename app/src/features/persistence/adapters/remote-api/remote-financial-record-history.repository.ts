import type { ListHistoryResponse } from "@fluxor/contracts";

import type { FinancialRecordHistoryRepositoryPort } from "@/features/persistence/ports";
import type {
  AppendHistoryEventData,
  FinancialRecordHistoryEvent,
} from "@/features/financial-records/domain";

import type { RemoteApiClient } from "./remote-api.client";

export class RemoteFinancialRecordHistoryRepository
  implements FinancialRecordHistoryRepositoryPort
{
  constructor(private readonly client: RemoteApiClient) {}

  /**
   * No-op: o servidor gera histórico nas mutações de registro.
   * Não há endpoint de criação manual na API V1.
   */
  async appendEvent(
    data: AppendHistoryEventData,
  ): Promise<FinancialRecordHistoryEvent> {
    return {
      id: "",
      recordId: data.recordId,
      eventType: data.eventType,
      description: data.description,
      metadata: data.metadata ?? null,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy ?? null,
    };
  }

  async listByRecord(recordId: string): Promise<FinancialRecordHistoryEvent[]> {
    return this.client.request<ListHistoryResponse>(
      `/financial-records/${recordId}/history`,
    );
  }
}
