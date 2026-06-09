import type {
  ListPayeesRequest,
  ListPayeesResponse,
} from "@fluxor/contracts";
import type { PayeeRepositoryPort } from "../../persistence/ports/payee-repository.port.js";

export class ListPayeesUseCase {
  constructor(private readonly payees: PayeeRepositoryPort) {}

  execute(request?: ListPayeesRequest): Promise<ListPayeesResponse> {
    return this.payees.list(request);
  }
}
