import { useCallback, useEffect, useState } from "react";

import { useActiveAccountId } from "@/features/home/hooks/useActiveAccountId";
import type { ThemeIconName } from "@/config/theme";
import { listCategories } from "@/features/categories/application";
import { DatabaseNotReadyError } from "@/features/database";
import { listFinancialRecords, summarizeAttachmentKindsByRecordIds } from "@/features/financial-records/application";
import { listPayees } from "@/features/payees/application";
import { mockFinancialData } from "@/features/home/mocks/home-context.mock";
import { mockCategoriesById } from "@/features/home/mocks/categories.mock";
import { mockPayeesById } from "@/features/home/mocks/records.mock";
import type { Category, FinancialRecord, Payee } from "@/features/home/types";
import { logRemoteDev } from "@/features/home/utils/dev-log";
import {
  isValidEntityId,
  shouldUseHomeMocks,
} from "@/features/home/utils/home-persistence";
import {
  domainRecordToHomeRecord,
  todayIsoDate,
} from "@/features/home/utils/domain-record-to-home-record";
import { getPersistenceConfig } from "@/features/persistence-setup";

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
  const usesMockData = shouldUseHomeMocks();
  const activeAccountId = useActiveAccountId();

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [categoriesById, setCategoriesById] = useState<Record<string, Category>>(
    {},
  );
  const [payeesById, setPayeesById] = useState<Record<string, Payee>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const referenceDate = usesMockData
    ? mockFinancialData.referenceDate
    : todayIsoDate();

  useEffect(() => {
    if (usesMockData) {
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

    if (!isValidEntityId(activeAccountId)) {
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

        const attachmentFlags = await summarizeAttachmentKindsByRecordIds(
          domainRecords.map((record) => record.id),
        );

        setRecords(
          domainRecords.map((record) => {
            const flags = attachmentFlags[record.id] ?? {
              hasDocument: false,
              hasReceipt: false,
            };

            return {
              ...domainRecordToHomeRecord(record, refDate),
              ...flags,
            };
          }),
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
          const config = getPersistenceConfig();
          logRemoteDev("HomeRecords load", {
            provider: config?.mode ?? "unknown",
            remoteBaseUrl: config?.remoteBaseUrl,
            walletId: activeAccountId,
            listCount: domainRecords.length,
            endpoint: `GET /api/v1/financial-records?walletId=${activeAccountId}`,
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
  }, [activeAccountId, refreshKey, reloadToken, usesMockData]);

  return {
    records,
    categoriesById,
    payeesById,
    referenceDate,
    isLoading,
    error,
    isBrowserFallback: usesMockData,
    reload,
  };
}
