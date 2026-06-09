import { useCallback, useEffect, useState } from "react";

import { DatabaseNotReadyError } from "@/features/database";
import { listCategories } from "@/features/categories/application";
import type { Category } from "@/features/categories/domain";

function getErrorMessage(error: unknown): string {
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro ao carregar categorias.";
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listCategories();
      setCategories(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    categories,
    isLoading,
    error,
    reload,
  };
}
