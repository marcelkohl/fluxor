import type { ThemeIconName } from "@/config/theme";

export type FinancialRecordType = "payable" | "receivable";

export type FinancialRecordStatus =
  | "pending"
  | "completed"
  | "overdue"
  | "canceled";

export interface AccountWallet {
  id: string;
  name: string;
  icon: ThemeIconName;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: ThemeIconName;
  color: string;
}

export interface Payee {
  id: string;
  name: string;
}

export interface FinancialRecord {
  id: string;
  title: string;
  accountId: string;
  categoryId: string;
  payeeId?: string;
  type: FinancialRecordType;
  status: FinancialRecordStatus;
  amount: number;
  date: string;
  /** Valor previsto em centavos — usado na efetivação rápida e widgets. */
  expectedAmountCents: number;
  /** Valor efetivado em centavos — preenchido quando completed. */
  effectiveAmountCents?: number | null;
  /** Observação cadastrada no registro. */
  recordNote?: string | null;
  /** Observação informada na efetivação. */
  paymentNote?: string | null;
  /** Campos opcionais — suporte a filtros V1; preenchidos quando disponíveis. */
  hasDocument?: boolean;
  hasReceipt?: boolean;
  isRecurring?: boolean;
  isTransfer?: boolean;
}

export interface RecordDayGroup {
  date: string;
  records: FinancialRecord[];
  totalReceivable: number;
  totalPayable: number;
}

export interface SelectedMonth {
  year: number;
  month: number;
}
