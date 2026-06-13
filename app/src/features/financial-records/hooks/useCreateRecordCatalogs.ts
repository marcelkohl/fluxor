import { useEffect, useState } from "react";

import { DatabaseNotReadyError } from "@/features/database";
import { listCategories } from "@/features/categories/application";
import type { Category } from "@/features/categories/domain";
import { listPayees } from "@/features/payees/application";
import type { Payee } from "@/features/payees/domain";
import { listWallets } from "@/features/wallets/application";
import type { Wallet } from "@/features/wallets/domain";

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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedCategories, loadedPayees, loadedWallets] = await Promise.all([
          listCategories(),
          listPayees(),
          listWallets(),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(loadedCategories);
        setPayees(loadedPayees);
        setWallets(loadedWallets.filter((wallet) => !wallet.isArchived));
      } catch (loadError) {
        if (!cancelled) {
          setError(getLoadErrorMessage(loadError));
          setCategories([]);
          setPayees([]);
          setWallets([]);
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
    wallets,
    isLoading,
    error,
  };
}
