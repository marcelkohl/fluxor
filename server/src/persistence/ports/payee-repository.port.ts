import type {
  CreatePayeeRequest,
  ListPayeesRequest,
  ListPayeesResponse,
  PayeeResponse,
  UpdatePayeeRequest,
} from "@fluxor/contracts";

export interface PayeeRepositoryPort {
  create(data: CreatePayeeRequest): Promise<PayeeResponse>;
  update(id: string, data: UpdatePayeeRequest): Promise<PayeeResponse>;
  list(request?: ListPayeesRequest): Promise<ListPayeesResponse>;
  getById(id: string): Promise<PayeeResponse | null>;
  archive(id: string): Promise<PayeeResponse>;
}
