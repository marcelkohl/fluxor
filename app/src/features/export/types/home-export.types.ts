import type { FinancialRecord } from "@/features/home/types";

export type HomeExportFormat = "csv" | "pdf";

export interface HomeExportInput {
  walletName: string;
  selectedMonth: number;
  selectedYear: number;
  records: FinancialRecord[];
  previousBalanceCents: number;
  generatedAt: Date;
}

export interface HomeExportRecordRow {
  date: string;
  description: string;
  expectedValue: string;
  effectiveValue: string;
  notes: string;
}

export interface HomeExportSummaryLine {
  label: string;
  value: string;
  indent?: boolean;
}

export interface HomeExportPayload {
  walletName: string;
  periodLabel: string;
  generatedAtLabel: string;
  filenameBase: string;
  summaryLines: HomeExportSummaryLine[];
  rows: HomeExportRecordRow[];
  recordCount: number;
}

export interface HomeExportContextInput {
  walletName: string;
  selectedMonth: number;
  selectedYear: number;
  records: FinancialRecord[];
  previousBalanceCents: number;
}
