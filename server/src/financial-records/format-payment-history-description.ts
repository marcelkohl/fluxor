import type { FinancialRecordType } from "@fluxor/contracts";

export function formatPaymentHistoryDescription(
  recordType: FinancialRecordType,
  effectiveAmount: number,
  effectiveDate: string,
): string {
  const amountLabel = (effectiveAmount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const [year, month, day] = effectiveDate.split("-");
  const dateLabel = `${day}/${month}/${year}`;
  const actionLabel = recordType === "payable" ? "Pagamento" : "Recebimento";

  return `${actionLabel} de ${amountLabel} em ${dateLabel}`;
}
