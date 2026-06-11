import type {
  AttachmentResponse,
  CreateAttachmentRequest,
  ListAttachmentsResponse,
} from "@fluxor/contracts";

export interface AttachmentRepositoryPort {
  create(data: CreateAttachmentRequest): Promise<AttachmentResponse>;
  remove(id: string): Promise<AttachmentResponse>;
  getById(id: string): Promise<AttachmentResponse | null>;
  listByRecord(recordId: string): Promise<ListAttachmentsResponse>;
}
