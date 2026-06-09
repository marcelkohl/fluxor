import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";
import type {
  PaginatedListResponse,
  PaginationRequest,
} from "../common/pagination";

export interface CreateWalletRequest {
  name: string;
  icon: string;
  color: string;
  notes?: string | null;
  isDefault?: boolean;
}

export interface UpdateWalletRequest {
  name?: string;
  icon?: string;
  color?: string;
  notes?: string | null;
}

export interface WalletResponse {
  id: EntityId;
  name: string;
  icon: string;
  color: string;
  notes: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export type ListWalletsRequest = PaginationRequest;

export type ListWalletsResponse =
  | WalletResponse[]
  | PaginatedListResponse<WalletResponse>;
