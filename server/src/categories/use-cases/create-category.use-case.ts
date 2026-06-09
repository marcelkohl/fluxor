import type {
  CategoryResponse,
  CreateCategoryRequest,
} from "@fluxor/contracts";
import type { CategoryRepositoryPort } from "../../persistence/ports/category-repository.port.js";

export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  execute(data: CreateCategoryRequest): Promise<CategoryResponse> {
    return this.categories.create(data);
  }
}
