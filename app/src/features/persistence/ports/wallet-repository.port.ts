import type {
  CreateWalletData,
  UpdateWalletData,
  Wallet,
} from "@/features/wallets/domain";

export interface WalletRepositoryPort {
  create(data: CreateWalletData): Promise<Wallet>;
  update(id: string, data: UpdateWalletData): Promise<Wallet>;
  listActive(): Promise<Wallet[]>;
  getById(id: string): Promise<Wallet | null>;
  archive(id: string): Promise<Wallet>;
  setDefault(id: string): Promise<Wallet>;
}
