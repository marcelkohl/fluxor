import type { WalletResponse } from "@fluxor/contracts";
import type { WalletRepositoryPort } from "../../persistence/ports/wallet-repository.port.js";

export class SetDefaultWalletUseCase {
  constructor(private readonly wallets: WalletRepositoryPort) {}

  execute(id: string): Promise<WalletResponse> {
    return this.wallets.setDefault(id);
  }
}
