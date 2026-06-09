import type {
  UpdateWalletRequest,
  WalletResponse,
} from "@fluxor/contracts";
import type { WalletRepositoryPort } from "../../persistence/ports/wallet-repository.port.js";
import { WalletNotFoundError } from "../errors/wallet-not-found.error.js";
import { WalletValidationError } from "../errors/wallet-validation.error.js";

export class UpdateWalletUseCase {
  constructor(private readonly wallets: WalletRepositoryPort) {}

  async execute(id: string, data: UpdateWalletRequest): Promise<WalletResponse> {
    const hasField =
      data.name !== undefined ||
      data.icon !== undefined ||
      data.color !== undefined ||
      data.notes !== undefined;

    if (!hasField) {
      throw new WalletValidationError(
        "no_fields_to_update",
        "At least one field must be provided",
      );
    }

    const existing = await this.wallets.getById(id);
    if (!existing) {
      throw new WalletNotFoundError(id);
    }

    return this.wallets.update(id, data);
  }
}
