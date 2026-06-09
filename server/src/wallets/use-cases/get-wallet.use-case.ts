import type { WalletResponse } from "@fluxor/contracts";
import type { WalletRepositoryPort } from "../../persistence/ports/wallet-repository.port.js";
import { WalletNotFoundError } from "../errors/wallet-not-found.error.js";

export class GetWalletUseCase {
  constructor(private readonly wallets: WalletRepositoryPort) {}

  async execute(id: string): Promise<WalletResponse> {
    const wallet = await this.wallets.getById(id);
    if (!wallet) {
      throw new WalletNotFoundError(id);
    }

    return wallet;
  }
}
