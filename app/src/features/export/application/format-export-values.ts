import { formatCurrency } from "@/features/home/utils";
import type { FinancialRecord } from "@/features/home/types";

export function formatExportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatExportDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatSignedCurrencyFromCents(
  type: FinancialRecord["type"],
  cents: number,
): string {
  const formatted = formatCurrency(Math.abs(cents) / 100);
  return type === "payable" ? `-${formatted}` : formatted;
}

export function buildExportNotes(record: FinancialRecord): string {
  const parts = [record.recordNote?.trim(), record.paymentNote?.trim()].filter(
    (value): value is string => Boolean(value),
  );

  return parts.join(" — ");
}

function formatExportMonthName(month: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(2020, month - 1, 1),
  );
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");
}

export function buildExportFilenameBase(
  walletName: string,
  year: number,
  month: number,
): string {
  const safeWalletName = sanitizeFilenamePart(walletName) || "carteira";
  const monthName = formatExportMonthName(month);

  return `${safeWalletName} - ${monthName} - ${year}`;
}
