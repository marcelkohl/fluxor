import { isThemePaletteColor } from "@/config/theme/theme.palette";
import { NotFoundError, ValidationError } from "@/features/database";
import {
  requireAtLeastOneField,
  requireNonEmpty,
} from "@/features/database/utils";
import { resolvePersistence } from "@/features/persistence";

import type { CreateCategoryData, UpdateCategoryData, Category } from "../domain";
import {
  CATEGORY_QUICK_DEFAULT_COLOR,
  CATEGORY_QUICK_DEFAULT_ICON,
  isControlledCategoryIcon,
} from "../domain";

function validateIcon(icon: string): string {
  if (!isControlledCategoryIcon(icon)) {
    throw new ValidationError("Ícone inválido");
  }
  return icon;
}

function validateColor(color: string): string {
  if (!isThemePaletteColor(color)) {
    throw new ValidationError("Cor inválida");
  }
  return color;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  description?: string | null;
}

export async function listCategories(): Promise<Category[]> {
  const { categories } = await resolvePersistence();
  return categories.listActive();
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const { categories } = await resolvePersistence();

  const data: CreateCategoryData = {
    name: requireNonEmpty(input.name, "Nome"),
    icon: validateIcon(input.icon),
    color: validateColor(input.color),
    description: input.description ?? null,
  };

  return categories.create(data);
}

export interface CreateCategoryQuickInput {
  name: string;
}

/** Atalho UX — delega a createCategory com icon/color padrão. */
export async function createCategoryQuick(
  input: CreateCategoryQuickInput,
): Promise<Category> {
  return createCategory({
    name: input.name,
    icon: CATEGORY_QUICK_DEFAULT_ICON,
    color: CATEGORY_QUICK_DEFAULT_COLOR,
  });
}

export interface UpdateCategoryInput {
  categoryId: string;
  name?: string;
  icon?: string;
  color?: string;
  description?: string | null;
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<Category> {
  const { categories } = await resolvePersistence();

  requireAtLeastOneField(
    {
      name: input.name,
      icon: input.icon,
      color: input.color,
      description: input.description,
    },
    "Categoria",
  );

  const existing = await categories.getById(input.categoryId);
  if (!existing) {
    throw new NotFoundError("Categoria não encontrada");
  }

  const data: UpdateCategoryData = {};
  if (input.name !== undefined) {
    data.name = requireNonEmpty(input.name, "Nome");
  }
  if (input.icon !== undefined) {
    data.icon = validateIcon(input.icon);
  }
  if (input.color !== undefined) {
    data.color = validateColor(input.color);
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }

  return categories.update(input.categoryId, data);
}

export async function archiveCategory(categoryId: string): Promise<Category> {
  const { categories } = await resolvePersistence();

  const existing = await categories.getById(categoryId);
  if (!existing) {
    throw new NotFoundError("Categoria não encontrada");
  }
  if (existing.isArchived) {
    throw new ValidationError("Categoria já está arquivada");
  }

  return categories.archive(categoryId);
}
