import type { ApiErrorCode } from "@fluxor/contracts";

export class WalletValidationError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WalletValidationError";
  }
}
