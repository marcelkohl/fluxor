import type {
  CreateWalletRequest,
  ListWalletsRequest,
  ListWalletsResponse,
  UpdateWalletRequest,
  WalletResponse,
} from "@fluxor/contracts";

export interface WalletRepositoryPort {
  create(data: CreateWalletRequest): Promise<WalletResponse>;
  update(id: string, data: UpdateWalletRequest): Promise<WalletResponse>;
  list(request?: ListWalletsRequest): Promise<ListWalletsResponse>;
  getById(id: string): Promise<WalletResponse | null>;
  archive(id: string): Promise<WalletResponse>;
  setDefault(id: string): Promise<WalletResponse>;
}
