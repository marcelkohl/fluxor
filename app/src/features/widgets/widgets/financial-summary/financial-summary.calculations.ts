import type { FinancialSummaryData } from "./financial-summary.types";

function centsToReais(cents: number): number {
  return cents / 100;
}

function isSettled(record: {
  status: string;
}): boolean {
  return record.status === "completed";
}

function isCanceled(record: { status: string }): boolean {
  return record.status === "canceled";
}

interface SummaryRecord {
  type: "payable" | "receivable";
  status: string;
  expectedAmountCents: number;
  effectiveAmountCents?: number | null;
}

export function calculateFinancialSummaryFromRecords(
  records: SummaryRecord[],
  previousBalanceCents: number,
): FinancialSummaryData {
  let toReceiveCents = 0;
  let toPayCents = 0;
  let receivedCents = 0;
  let paidCents = 0;
  let pendingReceivableCents = 0;
  let pendingPayableCents = 0;

  for (const record of records) {
    if (isCanceled(record)) {
      continue;
    }

    if (record.type === "receivable") {
      toReceiveCents += record.expectedAmountCents;

      if (isSettled(record)) {
        receivedCents += record.effectiveAmountCents ?? 0;
      } else {
        pendingReceivableCents += record.expectedAmountCents;
      }
      continue;
    }

    toPayCents += record.expectedAmountCents;

    if (isSettled(record)) {
      paidCents += record.effectiveAmountCents ?? 0;
    } else {
      pendingPayableCents += record.expectedAmountCents;
    }
  }

  const previousBalance = centsToReais(previousBalanceCents);
  const received = centsToReais(receivedCents);
  const paid = centsToReais(paidCents);
  const toReceive = centsToReais(toReceiveCents);
  const toPay = centsToReais(toPayCents);
  const currentBalance = previousBalance + received - paid;
  const expectedBalance =
    currentBalance +
    centsToReais(pendingReceivableCents) -
    centsToReais(pendingPayableCents);

  return {
    currentBalance,
    toReceive,
    toPay,
    received,
    paid,
    previousBalance,
    expectedBalance,
  };
}
