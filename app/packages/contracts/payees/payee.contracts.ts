import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";
import type {
  PaginatedListResponse,
  PaginationRequest,
} from "../common/pagination";

export interface CreatePayeeRequest {
  name: string;
  notes?: string | null;
}

export interface UpdatePayeeRequest {
  name?: string;
  notes?: string | null;
}

export interface PayeeResponse {
  id: EntityId;
  name: string;
  notes: string | null;
  isArchived: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export type ListPayeesRequest = PaginationRequest;

export type ListPayeesResponse =
  | PayeeResponse[]
  | PaginatedListResponse<PayeeResponse>;
