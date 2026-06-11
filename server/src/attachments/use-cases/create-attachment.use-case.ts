import type {
  AttachmentKind,
  AttachmentResponse,
  CreateAttachmentRequest,
} from "@fluxor/contracts";
import type { AttachmentRepositoryPort } from "../../persistence/ports/attachment-repository.port.js";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { FinancialRecordNotFoundError } from "../../financial-records/errors/financial-record-not-found.error.js";
import { AttachmentValidationError } from "../errors/attachment-validation.error.js";

const ATTACHMENT_KINDS: AttachmentKind[] = ["document", "receipt"];

export class CreateAttachmentUseCase {
  constructor(
    private readonly persistence: PersistenceProvider,
    private readonly attachments: AttachmentRepositoryPort,
    private readonly records: FinancialRecordRepositoryPort,
  ) {}

  async execute(data: CreateAttachmentRequest): Promise<AttachmentResponse> {
    const record = await this.records.getById(data.recordId);
    if (!record) {
      throw new FinancialRecordNotFoundError(data.recordId);
    }

    if (!ATTACHMENT_KINDS.includes(data.kind)) {
      throw new AttachmentValidationError(
        "validation_error",
        "kind must be document or receipt",
      );
    }

    if (!data.filename?.trim()) {
      throw new AttachmentValidationError(
        "validation_error",
        "filename is required",
      );
    }

    if (!data.mimeType?.trim()) {
      throw new AttachmentValidationError(
        "validation_error",
        "mimeType is required",
      );
    }

    if (!data.localPath?.trim()) {
      throw new AttachmentValidationError(
        "validation_error",
        "localPath is required",
      );
    }

    if (!Number.isInteger(data.size) || data.size < 0) {
      throw new AttachmentValidationError(
        "validation_error",
        "size must be a non-negative integer",
      );
    }

    const attachment = await this.attachments.create(data);

    await this.persistence.financialRecordHistory.appendEvent({
      recordId: attachment.recordId,
      eventType: "attachment_added",
      description: "Anexo adicionado",
      metadata: JSON.stringify({
        kind: attachment.kind,
        filename: attachment.filename,
      }),
    });

    return attachment;
  }
}
