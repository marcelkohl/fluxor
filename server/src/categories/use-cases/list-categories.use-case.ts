import type {
  ListCategoriesRequest,
  ListCategoriesResponse,
} from "@fluxor/contracts";
import type { CategoryRepositoryPort } from "../../persistence/ports/category-repository.port.js";

export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  execute(request?: ListCategoriesRequest): Promise<ListCategoriesResponse> {
    return this.categories.list(request);
  }
}
