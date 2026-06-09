import type { FinancialRecordType } from "@/features/financial-records/domain";
import type { FinancialRecordStatus } from "@/features/home/types";
import { formatCurrency } from "@/features/home/utils";

export const RECORD_TYPE_LABELS: Record<FinancialRecordType, string> = {
  payable: "A pagar",
  receivable: "A receber",
};

export const RECORD_STATUS_LABELS: Record<FinancialRecordStatus, string> = {
  pending: "Pendente",
  completed: "Efetivado",
  overdue: "Vencido",
  canceled: "Cancelado",
};

export function formatCentsToCurrency(cents: number): string {
  return formatCurrency(cents / 100);
}

export function formatDateTimePtBr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColorClass(status: FinancialRecordStatus): string {
  switch (status) {
    case "completed":
      return "text-income";
    case "overdue":
      return "text-expense";
    case "canceled":
      return "text-text-secondary";
    default:
      return "text-warning";
  }
}
