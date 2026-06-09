export interface PaginationRequest {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedListResponse<T> {
  items: T[];
  pagination: PaginationResponse;
}
