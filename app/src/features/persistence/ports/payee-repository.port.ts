import type {
  CreatePayeeData,
  Payee,
  UpdatePayeeData,
} from "@/features/payees/domain";

export interface PayeeRepositoryPort {
  create(data: CreatePayeeData): Promise<Payee>;
  update(id: string, data: UpdatePayeeData): Promise<Payee>;
  listActive(): Promise<Payee[]>;
  getById(id: string): Promise<Payee | null>;
  archive(id: string): Promise<Payee>;
}
