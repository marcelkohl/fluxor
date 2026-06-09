import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";

export type AttachmentKind = "document" | "receipt";

export interface CreateAttachmentRequest {
  recordId: EntityId;
  kind: AttachmentKind;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  label?: string | null;
}

export interface AttachmentResponse {
  id: EntityId;
  recordId: EntityId;
  kind: AttachmentKind;
  label: string | null;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  createdAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export type ListAttachmentsResponse = AttachmentResponse[];
