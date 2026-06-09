import type {
  CategoryResponse,
  CreateCategoryRequest,
  ListCategoriesResponse,
  UpdateCategoryRequest,
} from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { CategoryRepositoryPort } from "@/features/persistence/ports";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/features/categories/domain";

import type { RemoteApiClient } from "./remote-api.client";
import { unwrapList } from "./remote-api.utils";

export class RemoteCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly client: RemoteApiClient) {}

  async create(data: CreateCategoryData): Promise<Category> {
    const body: CreateCategoryRequest = {
      name: data.name,
      icon: data.icon,
      color: data.color,
      description: data.description,
    };

    return this.client.request<CategoryResponse>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const body: UpdateCategoryRequest = {
      name: data.name,
      icon: data.icon,
      color: data.color,
      description: data.description,
    };

    return this.client.request<CategoryResponse>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async listActive(): Promise<Category[]> {
    const response =
      await this.client.request<ListCategoriesResponse>("/categories");
    return unwrapList(response);
  }

  async getById(id: string): Promise<Category | null> {
    try {
      return await this.client.request<CategoryResponse>(`/categories/${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async archive(id: string): Promise<Category> {
    return this.client.request<CategoryResponse>(`/categories/${id}`, {
      method: "DELETE",
    });
  }
}
