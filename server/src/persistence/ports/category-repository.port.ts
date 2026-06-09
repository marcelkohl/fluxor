import type {
  CategoryResponse,
  CreateCategoryRequest,
  ListCategoriesRequest,
  ListCategoriesResponse,
  UpdateCategoryRequest,
} from "@fluxor/contracts";

export interface CategoryRepositoryPort {
  create(data: CreateCategoryRequest): Promise<CategoryResponse>;
  update(id: string, data: UpdateCategoryRequest): Promise<CategoryResponse>;
  list(request?: ListCategoriesRequest): Promise<ListCategoriesResponse>;
  getById(id: string): Promise<CategoryResponse | null>;
  archive(id: string): Promise<CategoryResponse>;
}
