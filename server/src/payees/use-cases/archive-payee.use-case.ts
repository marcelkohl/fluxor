import type { PayeeResponse } from "@fluxor/contracts";
import type { PayeeRepositoryPort } from "../../persistence/ports/payee-repository.port.js";

export class ArchivePayeeUseCase {
  constructor(private readonly payees: PayeeRepositoryPort) {}

  execute(id: string): Promise<PayeeResponse> {
    return this.payees.archive(id);
  }
}
