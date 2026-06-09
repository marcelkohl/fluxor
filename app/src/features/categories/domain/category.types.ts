export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCategoryData {
  name: string;
  icon: string;
  color: string;
  description?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string | null;
}
