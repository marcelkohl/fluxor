import type {
  AttachmentResponse,
  CreateAttachmentRequest,
  ListAttachmentsResponse,
} from "@fluxor/contracts";

import { NotFoundError } from "@/features/database";
import type { AttachmentRepositoryPort } from "@/features/persistence/ports";
import type {
  Attachment,
  CreateAttachmentData,
} from "@/features/financial-records/domain";

import type { RemoteApiClient } from "./remote-api.client";

export class RemoteAttachmentRepository implements AttachmentRepositoryPort {
  constructor(private readonly client: RemoteApiClient) {}

  async create(data: CreateAttachmentData): Promise<Attachment> {
    const body: CreateAttachmentRequest = {
      recordId: data.recordId,
      kind: data.kind,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      localPath: data.localPath,
      label: data.label,
    };

    return this.client.request<AttachmentResponse>("/attachments", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async remove(id: string): Promise<Attachment> {
    return this.client.request<AttachmentResponse>(`/attachments/${id}`, {
      method: "DELETE",
    });
  }

  async getById(id: string): Promise<Attachment | null> {
    try {
      return await this.client.request<AttachmentResponse>(`/attachments/${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async listByRecord(recordId: string): Promise<Attachment[]> {
    return this.client.request<ListAttachmentsResponse>(
      `/financial-records/${recordId}/attachments`,
    );
  }
}
