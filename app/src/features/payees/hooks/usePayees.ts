import { useCallback, useEffect, useState } from "react";

import { DatabaseNotReadyError } from "@/features/database";
import { listPayees } from "@/features/payees/application";
import type { Payee } from "@/features/payees/domain";

function getErrorMessage(error: unknown): string {
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro ao carregar favorecidos.";
}

export function usePayees() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listPayees();
      setPayees(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setPayees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    payees,
    isLoading,
    error,
    reload,
  };
}
