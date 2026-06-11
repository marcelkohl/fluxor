import type { AttachmentResponse } from "@fluxor/contracts";
import { AttachmentNotFoundError } from "../errors/attachment-not-found.error.js";
import type { AttachmentRepositoryPort } from "../../persistence/ports/attachment-repository.port.js";

export class GetAttachmentUseCase {
  constructor(private readonly attachments: AttachmentRepositoryPort) {}

  async execute(id: string): Promise<AttachmentResponse> {
    const attachment = await this.attachments.getById(id);
    if (!attachment) {
      throw new AttachmentNotFoundError(id);
    }

    return attachment;
  }
}
