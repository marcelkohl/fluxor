export type AttachmentKind = "document" | "receipt";

export interface Attachment {
  id: string;
  recordId: string;
  kind: AttachmentKind;
  label: string | null;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateAttachmentData {
  recordId: string;
  kind: AttachmentKind;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  label?: string | null;
}
