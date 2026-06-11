export class AttachmentNotFoundError extends Error {
  constructor(readonly attachmentId: string) {
    super(`Attachment not found: ${attachmentId}`);
    this.name = "AttachmentNotFoundError";
  }
}
