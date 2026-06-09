import type { CreatePayeeRequest, PayeeResponse } from "@fluxor/contracts";
import type { PayeeRepositoryPort } from "../../persistence/ports/payee-repository.port.js";

export class CreatePayeeUseCase {
  constructor(private readonly payees: PayeeRepositoryPort) {}

  execute(data: CreatePayeeRequest): Promise<PayeeResponse> {
    return this.payees.create(data);
  }
}
