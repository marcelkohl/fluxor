import type {
  ListWalletsRequest,
  ListWalletsResponse,
} from "@fluxor/contracts";
import type { WalletRepositoryPort } from "../../persistence/ports/wallet-repository.port.js";

export class ListWalletsUseCase {
  constructor(private readonly wallets: WalletRepositoryPort) {}

  execute(request?: ListWalletsRequest): Promise<ListWalletsResponse> {
    return this.wallets.list(request);
  }
}
