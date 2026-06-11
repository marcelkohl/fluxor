import type { AttachmentResponse } from "@fluxor/contracts";
import type { AttachmentRepositoryPort } from "../../persistence/ports/attachment-repository.port.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { AttachmentNotFoundError } from "../errors/attachment-not-found.error.js";

export class RemoveAttachmentUseCase {
  constructor(
    private readonly persistence: PersistenceProvider,
    private readonly attachments: AttachmentRepositoryPort,
  ) {}

  async execute(id: string): Promise<AttachmentResponse> {
    const existing = await this.attachments.getById(id);
    if (!existing) {
      throw new AttachmentNotFoundError(id);
    }

    const removed = await this.attachments.remove(id);

    await this.persistence.financialRecordHistory.appendEvent({
      recordId: removed.recordId,
      eventType: "attachment_removed",
      description: "Anexo removido",
      metadata: JSON.stringify({
        kind: removed.kind,
        filename: removed.filename,
      }),
    });

    return removed;
  }
}
