import type { CategoryResponse } from "@fluxor/contracts";
import type { CategoryRepositoryPort } from "../../persistence/ports/category-repository.port.js";

export class ArchiveCategoryUseCase {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  execute(id: string): Promise<CategoryResponse> {
    return this.categories.archive(id);
  }
}
