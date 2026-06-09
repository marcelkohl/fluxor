import type {
  CreatePayeeRequest,
  ListPayeesResponse,
  PayeeResponse,
  UpdatePayeeRequest,
} from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { PayeeRepositoryPort } from "@/features/persistence/ports";
import type {
  CreatePayeeData,
  Payee,
  UpdatePayeeData,
} from "@/features/payees/domain";

import type { RemoteApiClient } from "./remote-api.client";
import { unwrapList } from "./remote-api.utils";

export class RemotePayeeRepository implements PayeeRepositoryPort {
  constructor(private readonly client: RemoteApiClient) {}

  async create(data: CreatePayeeData): Promise<Payee> {
    const body: CreatePayeeRequest = {
      name: data.name,
      notes: data.notes,
    };

    return this.client.request<PayeeResponse>("/payees", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async update(id: string, data: UpdatePayeeData): Promise<Payee> {
    const body: UpdatePayeeRequest = {
      name: data.name,
      notes: data.notes,
    };

    return this.client.request<PayeeResponse>(`/payees/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async listActive(): Promise<Payee[]> {
    const response = await this.client.request<ListPayeesResponse>("/payees");
    return unwrapList(response);
  }

  async getById(id: string): Promise<Payee | null> {
    try {
      return await this.client.request<PayeeResponse>(`/payees/${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async archive(id: string): Promise<Payee> {
    return this.client.request<PayeeResponse>(`/payees/${id}`, {
      method: "DELETE",
    });
  }
}
