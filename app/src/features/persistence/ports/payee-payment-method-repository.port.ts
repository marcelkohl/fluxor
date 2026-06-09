import type {
  CreatePayeePaymentMethodData,
  PayeePaymentMethod,
} from "@/features/payees/domain";

export interface PayeePaymentMethodRepositoryPort {
  create(data: CreatePayeePaymentMethodData): Promise<PayeePaymentMethod>;
  listByPayee(payeeId: string): Promise<PayeePaymentMethod[]>;
  getById(id: string): Promise<PayeePaymentMethod | null>;
  remove(id: string): Promise<void>;
}
