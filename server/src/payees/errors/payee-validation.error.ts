import type { ApiErrorCode } from "@fluxor/contracts";

export class PayeeValidationError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PayeeValidationError";
  }
}
