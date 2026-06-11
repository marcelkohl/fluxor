import type { ApiErrorCode } from "@fluxor/contracts";

export class AttachmentValidationError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AttachmentValidationError";
  }
}
