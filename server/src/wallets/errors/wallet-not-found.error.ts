export class WalletNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Wallet not found: ${id}` : "Wallet not found");
    this.name = "WalletNotFoundError";
  }
}
