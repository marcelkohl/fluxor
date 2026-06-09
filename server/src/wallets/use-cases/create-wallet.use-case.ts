import type {
  CreateWalletRequest,
  WalletResponse,
} from "@fluxor/contracts";
import type { WalletRepositoryPort } from "../../persistence/ports/wallet-repository.port.js";

export class CreateWalletUseCase {
  constructor(private readonly wallets: WalletRepositoryPort) {}

  execute(data: CreateWalletRequest): Promise<WalletResponse> {
    return this.wallets.create(data);
  }
}
