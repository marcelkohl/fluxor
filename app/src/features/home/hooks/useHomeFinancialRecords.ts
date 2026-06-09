import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

import type { ThemeIconName } from "@/config/theme";
import { listCategories } from "@/features/categories/application";
import { DatabaseNotReadyError } from "@/features/database";
import { listFinancialRecords } from "@/features/financial-records/application";
import { listPayees } from "@/features/payees/application";
import { mockFinancialData } from "@/features/home/mocks/home-context.mock";
import { mockCategoriesById } from "@/features/home/mocks/categories.mock";
import { mockPayeesById } from "@/features/home/mocks/records.mock";
import { homeStateService } from "@/features/home/state";
import type { Category, FinancialRecord, Payee } from "@/features/home/types";
import {
  domainRecordToHomeRecord,
  todayIsoDate,
} from "@/features/home/utils/domain-record-to-home-record";

export interface UseHomeFinancialRecordsResult {
  /** Todos os registros ativos da carteira selecionada (todos os meses). */
  records: FinancialRecord[];
  categoriesById: Record<string, Category>;
  payeesById: Record<string, Payee>;
  referenceDate: string;
  isLoading: boolean;
  error: string | null;
  isBrowserFallback: boolean;
  reload: () => void;
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro ao carregar registros";
}

export function useHomeFinancialRecords(
  refreshKey?: string,
): UseHomeFinancialRecordsResult {
  const isBrowserFallback = !isTauri();

  const activeAccountId = useSyncExternalStore(
    (listener) => homeStateService.subscribe(listener),
    () => homeStateService.getState().activeAccountId,
    () => homeStateService.getState().activeAccountId,
  );

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [categoriesById, setCategoriesById] =
    useState<Record<string, Category>>(mockCategoriesById);
  const [payeesById, setPayeesById] =
    useState<Record<string, Payee>>(mockPayeesById);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const referenceDate = isBrowserFallback
    ? mockFinancialData.referenceDate
    : todayIsoDate();

  useEffect(() => {
    if (isBrowserFallback) {
      setRecords(
        mockFinancialData.records.filter(
          (record) => record.accountId === activeAccountId,
        ),
      );
      setCategoriesById(mockCategoriesById);
      setPayeesById(mockPayeesById);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!activeAccountId.trim()) {
      setRecords([]);
      setCategoriesById({});
      setPayeesById({});
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const refDate = todayIsoDate();
        const [domainRecords, categories, payees] = await Promise.all([
          listFinancialRecords({ walletId: activeAccountId }),
          listCategories(),
          listPayees(),
        ]);

        if (cancelled) {
          return;
        }

        setRecords(
          domainRecords.map((record) =>
            domainRecordToHomeRecord(record, refDate),
          ),
        );
        setCategoriesById(
          Object.fromEntries(
            categories.map((category) => [
              category.id,
              {
                id: category.id,
                name: category.name,
                icon: category.icon as ThemeIconName,
                color: category.color,
              },
            ]),
          ),
        );
        setPayeesById(
          Object.fromEntries(
            payees.map((payee) => [
              payee.id,
              { id: payee.id, name: payee.name },
            ]),
          ),
        );

        if (import.meta.env.DEV) {
          console.debug("[HomeRecords] SQLite load", {
            activeAccountId,
            listCount: domainRecords.length,
            dueDates: domainRecords.map((record) => record.dueDate),
            walletIds: [...new Set(domainRecords.map((record) => record.walletId))],
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getLoadErrorMessage(loadError));
          setRecords([]);
          setCategoriesById({});
          setPayeesById({});
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
  }, [activeAccountId, isBrowserFallback, refreshKey, reloadToken]);

  return {
    records,
    categoriesById,
    payeesById,
    referenceDate,
    isLoading,
    error,
    isBrowserFallback,
    reload,
  };
}
