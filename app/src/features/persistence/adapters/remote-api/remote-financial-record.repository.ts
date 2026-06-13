import type {
  CreateFinancialRecordRequest,
  FinancialRecordResponse,
  ListFinancialRecordsResponse,
  RecurrenceScope,
  RegisterPaymentRequest,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { FinancialRecordRepositoryPort } from "@/features/persistence/ports";
import type {
  CreateFinancialRecordData,
  FinancialRecord,
  ListFinancialRecordsFilter,
  RegisterPaymentData,
  UpdateFinancialRecordData,
} from "@/features/financial-records/domain";

import type { RemoteApiClient } from "./remote-api.client";
import { buildQueryString, unwrapList } from "./remote-api.utils";

export class RemoteFinancialRecordRepository
  implements FinancialRecordRepositoryPort
{
  constructor(private readonly client: RemoteApiClient) {}

  async create(data: CreateFinancialRecordData): Promise<FinancialRecord> {
    const body: CreateFinancialRecordRequest = {
      walletId: data.walletId,
      type: data.type,
      description: data.description,
      categoryId: data.categoryId,
      dueDate: data.dueDate,
      expectedAmount: data.expectedAmount,
      payeeId: data.payeeId,
      recordNote: data.recordNote,
      alertEnabled: data.alertEnabled,
      alertOffset: data.alertOffset,
      recurrenceGroupId: data.recurrenceGroupId,
      recurrenceIndex: data.recurrenceIndex,
      transferGroupId: data.transferGroupId,
    };

    return this.client.request<FinancialRecordResponse>("/financial-records", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async update(
    id: string,
    data: UpdateFinancialRecordData,
  ): Promise<FinancialRecord> {
    const body: UpdateFinancialRecordRequest = {
      walletId: data.walletId,
      type: data.type,
      description: data.description,
      categoryId: data.categoryId,
      dueDate: data.dueDate,
      expectedAmount: data.expectedAmount,
      payeeId: data.payeeId,
      recordNote: data.recordNote,
      alertEnabled: data.alertEnabled,
      alertOffset: data.alertOffset,
      transferGroupId: data.transferGroupId,
      scope: data.scope,
    };

    return this.client.request<FinancialRecordResponse>(
      `/financial-records/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  }

  async registerPayment(
    id: string,
    data: RegisterPaymentData,
  ): Promise<FinancialRecord> {
    const body: RegisterPaymentRequest = {
      effectiveDate: data.effectiveDate,
      effectiveAmount: data.effectiveAmount,
      paymentNote: data.paymentNote,
    };

    return this.client.request<FinancialRecordResponse>(
      `/financial-records/${id}/register-payment`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  async revertPayment(id: string): Promise<FinancialRecord> {
    return this.client.request<FinancialRecordResponse>(
      `/financial-records/${id}/revert-payment`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  }

  async archive(
    id: string,
    options?: { scope?: RecurrenceScope },
  ): Promise<FinancialRecord> {
    const query =
      options?.scope != null ? `?scope=${encodeURIComponent(options.scope)}` : "";

    return this.client.request<FinancialRecordResponse>(
      `/financial-records/${id}${query}`,
      {
        method: "DELETE",
      },
    );
  }

  async getById(id: string): Promise<FinancialRecord | null> {
    try {
      return await this.client.request<FinancialRecordResponse>(
        `/financial-records/${id}`,
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async list(
    filter: ListFinancialRecordsFilter = {},
  ): Promise<FinancialRecord[]> {
    const query = buildQueryString({
      walletId: filter.walletId,
    });
    const response = await this.client.request<ListFinancialRecordsResponse>(
      `/financial-records${query}`,
    );
    return unwrapList(response);
  }

  async listByRecurrenceGroup(
    _recurrenceGroupId: string,
    _options?: { minRecurrenceIndex?: number },
  ): Promise<FinancialRecord[]> {
    return [];
  }
}
