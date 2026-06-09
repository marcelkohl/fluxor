import type {
  CreateWalletRequest,
  ListWalletsResponse,
  UpdateWalletRequest,
  WalletResponse,
} from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { WalletRepositoryPort } from "@/features/persistence/ports";
import type {
  CreateWalletData,
  UpdateWalletData,
  Wallet,
} from "@/features/wallets/domain";

import type { RemoteApiClient } from "./remote-api.client";
import { unwrapList } from "./remote-api.utils";

export class RemoteWalletRepository implements WalletRepositoryPort {
  constructor(private readonly client: RemoteApiClient) {}

  async create(data: CreateWalletData): Promise<Wallet> {
    const body: CreateWalletRequest = {
      name: data.name,
      icon: data.icon,
      color: data.color,
      notes: data.notes,
      isDefault: data.isDefault,
    };

    return this.client.request<WalletResponse>("/wallets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async update(id: string, data: UpdateWalletData): Promise<Wallet> {
    const body: UpdateWalletRequest = {
      name: data.name,
      icon: data.icon,
      color: data.color,
      notes: data.notes,
    };

    return this.client.request<WalletResponse>(`/wallets/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async listActive(): Promise<Wallet[]> {
    const response = await this.client.request<ListWalletsResponse>("/wallets");
    return unwrapList(response);
  }

  async getById(id: string): Promise<Wallet | null> {
    try {
      return await this.client.request<WalletResponse>(`/wallets/${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async archive(id: string): Promise<Wallet> {
    return this.client.request<WalletResponse>(`/wallets/${id}`, {
      method: "DELETE",
    });
  }

  async setDefault(id: string): Promise<Wallet> {
    return this.client.request<WalletResponse>(`/wallets/${id}/set-default`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }
}
