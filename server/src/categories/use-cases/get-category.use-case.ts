import type { CategoryResponse } from "@fluxor/contracts";
import type { CategoryRepositoryPort } from "../../persistence/ports/category-repository.port.js";
import { CategoryNotFoundError } from "../errors/category-not-found.error.js";

export class GetCategoryUseCase {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  async execute(id: string): Promise<CategoryResponse> {
    const category = await this.categories.getById(id);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    return category;
  }
}
