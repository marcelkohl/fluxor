import { useCallback, useEffect, useRef, useState } from "react";

import { listCategories } from "@/features/categories/application";
import type { Category } from "@/features/categories/domain";
import { DatabaseNotReadyError, NotFoundError } from "@/features/database";
import {
  getFinancialRecordById,
  getRecurrenceBatch,
  listAttachmentsByRecord,
  listHistoryByRecord,
} from "@/features/financial-records/application";
import type {
  Attachment,
  FinancialRecord,
  FinancialRecordHistoryEvent,
} from "@/features/financial-records/domain";
import { listPayees } from "@/features/payees/application";
import type { Payee } from "@/features/payees/domain";
import { getWalletById } from "@/features/wallets/application";
import type { Wallet } from "@/features/wallets/domain";
import type { FinancialRecordStatus } from "@/features/home/types";
import {
  deriveDisplayStatus,
  todayIsoDate,
} from "@/features/home/utils/domain-record-to-home-record";

export interface FinancialRecordDetailsData {
  record: FinancialRecord;
  wallet: Wallet | null;
  category: Category | null;
  payee: Payee | null;
  documents: Attachment[];
  receipts: Attachment[];
  history: FinancialRecordHistoryEvent[];
  displayStatus: FinancialRecordStatus;
  referenceDate: string;
  recurrenceLabel: string | null;
}

export interface UseFinancialRecordDetailsResult {
  data: FinancialRecordDetailsData | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof DatabaseNotReadyError) {
    return "SQLite disponível apenas no app Tauri";
  }
  if (error instanceof NotFoundError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro ao carregar registro";
}

export function useFinancialRecordDetails(
  recordId: string | undefined,
): UseFinancialRecordDetailsResult {
  const [data, setData] = useState<FinancialRecordDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [recordId]);

  useEffect(() => {
    if (!recordId?.trim()) {
      setData(null);
      setError("Registro inválido");
      setNotFound(false);
      setIsLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    let cancelled = false;
    const id = recordId.trim();
    const isBackgroundRefresh = hasLoadedRef.current;

    async function load() {
      if (!isBackgroundRefresh) {
        setIsLoading(true);
        setError(null);
        setNotFound(false);
        setData(null);
      }

      try {
        const referenceDate = todayIsoDate();
        const [record, attachments, history, categories, payees] =
          await Promise.all([
            getFinancialRecordById(id),
            listAttachmentsByRecord(id),
            listHistoryByRecord(id),
            listCategories(),
            listPayees(),
          ]);

        let wallet: Wallet | null = null;
        try {
          wallet = await getWalletById(record.walletId);
        } catch {
          wallet = null;
        }

        if (cancelled) {
          return;
        }

        const category =
          categories.find((item) => item.id === record.categoryId) ?? null;
        const payee = record.payeeId
          ? (payees.find((item) => item.id === record.payeeId) ?? null)
          : null;

        let recurrenceLabel: string | null = null;
        if (
          record.recurrenceGroupId &&
          record.recurrenceIndex != null
        ) {
          try {
            const batch = await getRecurrenceBatch(record.recurrenceGroupId);
            recurrenceLabel = `${record.recurrenceIndex}/${batch.occurrenceCount}`;
          } catch {
            recurrenceLabel = `${record.recurrenceIndex}/?`;
          }
        }

        setData({
          record,
          wallet,
          category,
          payee,
          documents: attachments.filter((item) => item.kind === "document"),
          receipts: attachments.filter((item) => item.kind === "receipt"),
          history: [...history].reverse(),
          displayStatus: deriveDisplayStatus(record, referenceDate),
          referenceDate,
          recurrenceLabel,
        });
        setError(null);
        setNotFound(false);
        hasLoadedRef.current = true;
      } catch (loadError) {
        if (!cancelled) {
          if (!isBackgroundRefresh) {
            setError(getLoadErrorMessage(loadError));
            setNotFound(loadError instanceof NotFoundError);
          }
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
  }, [recordId, refreshKey]);

  return {
    data,
    isLoading,
    error,
    notFound,
    reload,
  };
}
