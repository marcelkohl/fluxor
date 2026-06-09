import { useEffect, useState } from "react";

import {
  ColorPickerSheet,
  FormFieldRow,
  FormInputRow,
  FormSheetHeader,
  FormSheetPanel,
  IconPickerSheet,
  SheetScaffold,
  TextEditorSheet,
} from "@/components/admin-form";
import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { getThemeColorLabel } from "@/config/theme/theme.palette";
import type { ThemePaletteColor } from "@/config/theme/theme.palette";
import {
  ValidationError,
  NotFoundError,
  DatabaseNotReadyError,
} from "@/features/database";
import {
  archiveCategory,
  createCategory,
  updateCategory,
} from "@/features/categories/application";
import {
  categoryColorOptions,
  categoryIconLabels,
  categoryIconOptions,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  type CategoryIconOption,
} from "@/features/categories/config/category-options";
import type { Category } from "@/features/categories/domain";

export interface CategoryFormSheetProps {
  isOpen: boolean;
  mode: "create" | "edit";
  category: Category | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

interface CategoryFormState {
  name: string;
  icon: CategoryIconOption;
  color: ThemePaletteColor;
  description: string;
}

type ActivePicker = "icon" | "color" | "description" | null;

function summarizeText(text: string, maxLength = 32): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Sem descrição";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível salvar a categoria.";
}

function logCategoryError(context: string, error: unknown): void {
  console.error(`[CategoryFormSheet] ${context}`, error);
}

function buildInitialState(category: Category | null): CategoryFormState {
  if (category) {
    const icon = categoryIconOptions.includes(category.icon as CategoryIconOption)
      ? (category.icon as CategoryIconOption)
      : DEFAULT_CATEGORY_ICON;
    const color = categoryColorOptions.includes(
      category.color as ThemePaletteColor,
    )
      ? (category.color as ThemePaletteColor)
      : DEFAULT_CATEGORY_COLOR;

    return {
      name: category.name,
      icon,
      color,
      description: category.description ?? "",
    };
  }

  return {
    name: "",
    icon: DEFAULT_CATEGORY_ICON,
    color: DEFAULT_CATEGORY_COLOR,
    description: "",
  };
}

export function CategoryFormSheet({
  isOpen,
  mode,
  category,
  onClose,
  onSaved,
}: CategoryFormSheetProps) {
  const [form, setForm] = useState<CategoryFormState>(() =>
    buildInitialState(category),
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState(category));
      setActivePicker(null);
      setError(null);
      setShowArchiveConfirm(false);
    }
  }, [isOpen, category]);

  if (!isOpen) {
    return null;
  }

  const title = mode === "create" ? "Nova categoria" : "Editar categoria";

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const trimmedName = form.name.trim();
      const description = form.description.trim() ? form.description.trim() : null;

      if (mode === "create") {
        await createCategory({
          name: trimmedName,
          icon: form.icon,
          color: form.color,
          description,
        });
      } else if (category) {
        await updateCategory({
          categoryId: category.id,
          name: trimmedName,
          icon: form.icon,
          color: form.color,
          description,
        });
      } else {
        return;
      }

      await onSaved();
      onClose();
    } catch (saveError) {
      logCategoryError("Falha ao salvar categoria", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!category) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await archiveCategory(category.id);
      await onSaved();
      onClose();
    } catch (archiveError) {
      logCategoryError("Falha ao arquivar categoria", archiveError);
      setError(getErrorMessage(archiveError));
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  }

  const archiveFooter =
    mode === "edit" && category ? (
      <footer className="border-t border-border px-4 py-3">
        {showArchiveConfirm ? (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Arquivar &ldquo;{category.name}&rdquo;? A categoria deixa de
              aparecer nas telas operacionais, mas os dados permanecem salvos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => void handleArchive()}
                className="flex-1 rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm font-medium text-expense transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isArchiving ? "Arquivando..." : "Confirmar"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="w-full py-2 text-sm font-medium text-expense transition-opacity hover:opacity-80"
          >
            Arquivar categoria
          </button>
        )}
      </footer>
    ) : null;

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        titleId="category-form-title"
        onClose={onClose}
      >
        <FormSheetPanel footer={archiveFooter}>
          <FormSheetHeader
            title={title}
            titleId="category-form-title"
            onCancel={onClose}
            onSave={() => void handleSave()}
            saveDisabled={!form.name.trim()}
            isSaving={isSaving}
          />

          <div className="divide-y divide-border/50 px-4">
            <FormInputRow
              label="Nome"
              value={form.name}
              placeholder="Ex.: Alimentação"
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />

            <FormFieldRow
              label="Ícone"
              value={
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-link-soft text-link">
                    <ThemeIcon name={form.icon as ThemeIconName} size="sm" />
                  </span>
                  <span className="truncate">
                    {categoryIconLabels[form.icon]}
                  </span>
                </span>
              }
              onClick={() => setActivePicker("icon")}
            />

            <FormFieldRow
              label="Cor"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: form.color }}
                    aria-hidden
                  />
                  <span className="truncate">
                    {getThemeColorLabel(form.color)}
                  </span>
                </span>
              }
              onClick={() => setActivePicker("color")}
            />

            <FormFieldRow
              label="Descrição"
              value={summarizeText(form.description)}
              onClick={() => setActivePicker("description")}
            />
          </div>

          {error ? (
            <p className="mx-4 my-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
              {error}
            </p>
          ) : null}
        </FormSheetPanel>
      </SheetScaffold>

      <IconPickerSheet
        isOpen={activePicker === "icon"}
        title="Ícone"
        selected={form.icon}
        options={categoryIconOptions}
        getLabel={(icon) => categoryIconLabels[icon as CategoryIconOption]}
        onSelect={(icon) =>
          setForm((current) => ({
            ...current,
            icon: icon as CategoryIconOption,
          }))
        }
        onClose={() => setActivePicker(null)}
      />

      <ColorPickerSheet
        isOpen={activePicker === "color"}
        title="Cor"
        selected={form.color}
        options={categoryColorOptions}
        getLabel={(color) => getThemeColorLabel(color as ThemePaletteColor)}
        onSelect={(color) =>
          setForm((current) => ({
            ...current,
            color: color as ThemePaletteColor,
          }))
        }
        onClose={() => setActivePicker(null)}
      />

      <TextEditorSheet
        isOpen={activePicker === "description"}
        title="Descrição"
        value={form.description}
        placeholder="Descrição opcional da categoria"
        onSave={(description) =>
          setForm((current) => ({ ...current, description }))
        }
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
