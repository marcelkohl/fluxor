import type { ReactNode } from "react";

import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { formatCurrency } from "@/features/home/utils";
import type { WidgetProps } from "@/features/widgets/types";

import { calculateFinancialSummaryFromRecords } from "./financial-summary.calculations";

export function FinancialSummaryWidget({ context }: WidgetProps) {
  const summary = calculateFinancialSummaryFromRecords(
    context.records,
    context.previousBalanceCents,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-3">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
        Resumo financeiro
      </h2>

      <section className="shrink-0 rounded-xl border border-link/40 bg-link-soft px-3 py-2 text-center">
        <p className="text-[10px] font-semibold text-link">Saldo Atual</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight text-link">
          {formatCurrency(summary.currentBalance)}
        </p>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <FlowCard
          value={summary.toReceive}
          secondaryLabel="Recebido"
          secondaryValue={summary.received}
          tone="income"
          icon={<ArrowDownIcon className="h-4 w-4" />}
        />
        <FlowCard
          value={summary.toPay}
          secondaryLabel="Pago"
          secondaryValue={summary.paid}
          tone="expense"
          icon={<ArrowUpIcon className="h-4 w-4" />}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <BalanceMetricCard
          title="Saldo Anterior"
          value={summary.previousBalance}
          iconName="wallet"
        />
        <BalanceMetricCard
          title="Saldo Esperado"
          value={summary.expectedBalance}
          iconName="diagnostics"
        />
      </div>
    </div>
  );
}

interface FlowCardProps {
  value: number;
  secondaryLabel: string;
  secondaryValue: number;
  tone: "income" | "expense";
  icon: ReactNode;
}

function FlowCard({
  value,
  secondaryLabel,
  secondaryValue,
  tone,
  icon,
}: FlowCardProps) {
  const toneColor = tone === "income" ? "text-income" : "text-expense";
  const borderTint =
    tone === "income" ? "border-income/20" : "border-expense/20";
  const ariaLabel = tone === "income" ? "A Receber" : "A Pagar";

  return (
    <div
      aria-label={ariaLabel}
      className={`flex flex-col rounded-xl border bg-surface px-2.5 py-2 ${borderTint}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`shrink-0 ${toneColor}`}>{icon}</span>
        <p
          className={`shrink-0 text-lg font-bold tabular-nums leading-none ${toneColor}`}
        >
          {formatCurrency(value)}
        </p>
      </div>

      <div className="mt-1 shrink-0 border-t border-border/50 pt-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-text-secondary">
            {secondaryLabel}
          </span>
          <span className="text-[11px] tabular-nums text-text-secondary">
            {formatCurrency(secondaryValue)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface BalanceMetricCardProps {
  title: string;
  value: number;
  iconName: ThemeIconName;
}

function BalanceMetricCard({ title, value, iconName }: BalanceMetricCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-link/25 bg-link-soft/45 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-link">
        <ThemeIcon name={iconName} size="sm" />
        <p className="text-xs font-semibold leading-tight text-text-secondary">
          {title}
        </p>
      </div>

      <p className="mt-1.5 text-lg font-bold tabular-nums leading-none text-link">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
