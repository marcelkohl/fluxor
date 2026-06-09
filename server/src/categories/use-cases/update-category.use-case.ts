import type {
  CategoryResponse,
  UpdateCategoryRequest,
} from "@fluxor/contracts";
import type { CategoryRepositoryPort } from "../../persistence/ports/category-repository.port.js";
import { CategoryNotFoundError } from "../errors/category-not-found.error.js";
import { CategoryValidationError } from "../errors/category-validation.error.js";

export class UpdateCategoryUseCase {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  async execute(
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<CategoryResponse> {
    const hasField =
      data.name !== undefined ||
      data.icon !== undefined ||
      data.color !== undefined ||
      data.description !== undefined;

    if (!hasField) {
      throw new CategoryValidationError(
        "no_fields_to_update",
        "At least one field must be provided",
      );
    }

    const existing = await this.categories.getById(id);
    if (!existing) {
      throw new CategoryNotFoundError(id);
    }

    return this.categories.update(id, data);
  }
}
