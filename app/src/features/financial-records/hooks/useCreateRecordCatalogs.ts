import { useEffect, useState } from "react";

import { DatabaseNotReadyError } from "@/features/database";
import { listCategories } from "@/features/categories/application";
import type { Category } from "@/features/categories/domain";
import { listPayees } from "@/features/payees/application";
import type { Payee } from "@/features/payees/domain";

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no Tauri";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro ao carregar dados do formulário";
}

export function useCreateRecordCatalogs() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedCategories, loadedPayees] = await Promise.all([
          listCategories(),
          listPayees(),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(loadedCategories);
        setPayees(loadedPayees);
      } catch (loadError) {
        if (!cancelled) {
          setError(getLoadErrorMessage(loadError));
          setCategories([]);
          setPayees([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories,
    payees,
    isLoading,
    error,
  };
}
