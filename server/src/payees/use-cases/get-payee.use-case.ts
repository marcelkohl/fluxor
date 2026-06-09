import type { PayeeResponse } from "@fluxor/contracts";
import type { PayeeRepositoryPort } from "../../persistence/ports/payee-repository.port.js";
import { PayeeNotFoundError } from "../errors/payee-not-found.error.js";

export class GetPayeeUseCase {
  constructor(private readonly payees: PayeeRepositoryPort) {}

  async execute(id: string): Promise<PayeeResponse> {
    const payee = await this.payees.getById(id);
    if (!payee) {
      throw new PayeeNotFoundError(id);
    }

    return payee;
  }
}
