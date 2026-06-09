import type { PayeeResponse, UpdatePayeeRequest } from "@fluxor/contracts";
import type { PayeeRepositoryPort } from "../../persistence/ports/payee-repository.port.js";
import { PayeeNotFoundError } from "../errors/payee-not-found.error.js";
import { PayeeValidationError } from "../errors/payee-validation.error.js";

export class UpdatePayeeUseCase {
  constructor(private readonly payees: PayeeRepositoryPort) {}

  async execute(id: string, data: UpdatePayeeRequest): Promise<PayeeResponse> {
    const hasField = data.name !== undefined || data.notes !== undefined;

    if (!hasField) {
      throw new PayeeValidationError(
        "no_fields_to_update",
        "At least one field must be provided",
      );
    }

    const existing = await this.payees.getById(id);
    if (!existing) {
      throw new PayeeNotFoundError(id);
    }

    return this.payees.update(id, data);
  }
}
