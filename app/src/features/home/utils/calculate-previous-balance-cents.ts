import type { FinancialRecord } from "@/features/home/types";

function isBeforeMonth(
  recordDate: string,
  year: number,
  month: number,
): boolean {
  const [recordYear, recordMonth] = recordDate.split("-").map(Number);
  if (recordYear < year) {
    return true;
  }
  if (recordYear > year) {
    return false;
  }
  return recordMonth < month;
}

/**
 * Saldo acumulado até o mês anterior ao selecionado na Home.
 * Usa todos os registros da carteira ativa (sem filtros da Home).
 */
export function calculatePreviousBalanceCents(
  records: FinancialRecord[],
  year: number,
  month: number,
): number {
  let balanceCents = 0;

  for (const record of records) {
    if (record.status === "canceled") {
      continue;
    }

    if (!isBeforeMonth(record.date, year, month)) {
      continue;
    }

    const sign = record.type === "receivable" ? 1 : -1;
    const amountCents =
      record.status === "completed"
        ? (record.effectiveAmountCents ?? 0)
        : record.expectedAmountCents;

    balanceCents += sign * amountCents;
  }

  return balanceCents;
}
