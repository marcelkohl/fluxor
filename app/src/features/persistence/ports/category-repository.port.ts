import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/features/categories/domain";

export interface CategoryRepositoryPort {
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  listActive(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  archive(id: string): Promise<Category>;
}
