import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";
import type {
  PaginatedListResponse,
  PaginationRequest,
} from "../common/pagination";

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
  description?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  description?: string | null;
}

export interface CategoryResponse {
  id: EntityId;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  isArchived: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export type ListCategoriesRequest = PaginationRequest;

export type ListCategoriesResponse =
  | CategoryResponse[]
  | PaginatedListResponse<CategoryResponse>;
