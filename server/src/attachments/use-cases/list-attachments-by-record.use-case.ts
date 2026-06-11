import type { ListAttachmentsResponse } from "@fluxor/contracts";
import type { AttachmentRepositoryPort } from "../../persistence/ports/attachment-repository.port.js";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { FinancialRecordNotFoundError } from "../../financial-records/errors/financial-record-not-found.error.js";

export class ListAttachmentsByRecordUseCase {
  constructor(
    private readonly attachments: AttachmentRepositoryPort,
    private readonly records: FinancialRecordRepositoryPort,
  ) {}

  async execute(recordId: string): Promise<ListAttachmentsResponse> {
    const record = await this.records.getById(recordId);
    if (!record) {
      throw new FinancialRecordNotFoundError(recordId);
    }

    return this.attachments.listByRecord(recordId);
  }
}
