import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AdminSearchField } from "@/components/admin-form";
import { ThemeIcon } from "@/config/theme";
import { CategoryFormSheet } from "@/features/categories/components/CategoryFormSheet";
import { CategoryListItem } from "@/features/categories/components/CategoryListItem";
import { useCategories } from "@/features/categories/hooks/useCategories";
import type { Category } from "@/features/categories/domain";

type CategorySheetState =
  | { mode: "create" }
  | { mode: "edit"; category: Category };

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function CategoriesPage() {
  const navigate = useNavigate();
  const { categories, isLoading, error, reload } = useCategories();
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<CategorySheetState | null>(null);

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      const haystack = [category.name, category.description ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, categories]);

  function openCreate() {
    setSheet({ mode: "create" });
  }

  function openEdit(category: Category) {
    setSheet({ mode: "edit", category });
  }

  function closeSheet() {
    setSheet(null);
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate("/settings")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-text-primary">
          Categorias
        </h1>

        <button
          type="button"
          aria-label="Adicionar categoria"
          onClick={openCreate}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-link transition-colors hover:bg-link-soft"
        >
          <ThemeIcon name="add" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AdminSearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar categorias..."
          ariaLabel="Buscar categorias"
        />

        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando categorias...
          </p>
        ) : error ? (
          <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {error}
          </p>
        ) : filteredCategories.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              {search.trim()
                ? "Nenhuma categoria encontrada"
                : "Nenhuma categoria cadastrada"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {search.trim()
                ? "Tente outro termo de busca."
                : "Toque em + para adicionar a primeira categoria."}
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/50">
            {filteredCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                onClick={() => openEdit(category)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && categories.length > 0 ? (
          <p className="mt-6 text-center text-xs text-text-secondary">
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1
              ? "categoria encontrada"
              : "categorias encontradas"}
          </p>
        ) : null}
      </div>

      <CategoryFormSheet
        isOpen={sheet !== null}
        mode={sheet?.mode ?? "create"}
        category={sheet?.mode === "edit" ? sheet.category : null}
        onClose={closeSheet}
        onSaved={reload}
      />
    </div>
  );
}
