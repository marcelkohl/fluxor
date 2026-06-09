import { formatCurrency, formatMonthYear } from "@/features/home/utils";
import type { FinancialRecord } from "@/features/home/types";
import { calculateFinancialSummaryFromRecords } from "@/features/widgets/widgets/financial-summary";

import {
  buildExportFilenameBase,
  buildExportNotes,
  formatExportDate,
  formatExportDateTime,
  formatSignedCurrencyFromCents,
} from "./format-export-values";
import type {
  HomeExportInput,
  HomeExportPayload,
  HomeExportRecordRow,
  HomeExportSummaryLine,
} from "../types";

function mapRecordToExportRow(record: FinancialRecord): HomeExportRecordRow {
  const effectiveValue =
    record.status === "completed" && record.effectiveAmountCents != null
      ? formatSignedCurrencyFromCents(
          record.type,
          record.effectiveAmountCents,
        )
      : "";

  return {
    date: formatExportDate(record.date),
    description: record.title,
    expectedValue: formatSignedCurrencyFromCents(
      record.type,
      record.expectedAmountCents,
    ),
    effectiveValue,
    notes: buildExportNotes(record),
  };
}

function buildSummaryLines(
  summary: ReturnType<typeof calculateFinancialSummaryFromRecords>,
): HomeExportSummaryLine[] {
  return [
    { label: "Saldo Anterior", value: formatCurrency(summary.previousBalance) },
    { label: "A Pagar", value: formatCurrency(summary.toPay) },
    { label: "Pago", value: formatCurrency(summary.paid), indent: true },
    { label: "A Receber", value: formatCurrency(summary.toReceive) },
    { label: "Recebido", value: formatCurrency(summary.received), indent: true },
    { label: "Saldo Atual", value: formatCurrency(summary.currentBalance) },
    { label: "Saldo Esperado", value: formatCurrency(summary.expectedBalance) },
  ];
}

export function buildHomeExportPayload(input: HomeExportInput): HomeExportPayload {
  const summary = calculateFinancialSummaryFromRecords(
    input.records,
    input.previousBalanceCents,
  );

  const sortedRecords = [...input.records].sort((left, right) => {
    const dateComparison = left.date.localeCompare(right.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return left.title.localeCompare(right.title, "pt-BR");
  });

  return {
    walletName: input.walletName,
    periodLabel: formatMonthYear(input.selectedYear, input.selectedMonth),
    generatedAtLabel: formatExportDateTime(input.generatedAt),
    filenameBase: buildExportFilenameBase(
      input.walletName,
      input.selectedYear,
      input.selectedMonth,
    ),
    summaryLines: buildSummaryLines(summary),
    rows: sortedRecords.map(mapRecordToExportRow),
    recordCount: sortedRecords.length,
  };
}
