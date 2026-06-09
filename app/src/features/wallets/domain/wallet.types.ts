export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateWalletData {
  name: string;
  icon: string;
  color: string;
  notes?: string | null;
  isDefault?: boolean;
}

export interface UpdateWalletData {
  name?: string;
  icon?: string;
  color?: string;
  notes?: string | null;
}
