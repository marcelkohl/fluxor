import type { AttachmentResponse } from "@fluxor/contracts";
import { toIsoDateTime } from "../../../shared/datetime.js";

export const ATTACHMENT_SELECT_COLUMNS = `
  id,
  recordId,
  kind,
  label,
  filename,
  mimeType,
  size,
  localPath,
  createdAt,
  deletedAt
`.trim();

export interface AttachmentRow {
  id: string;
  recordId: string;
  kind: string;
  label: string | null;
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  createdAt: Date | string;
  deletedAt: Date | string | null;
}

export const ACTIVE_ATTACHMENT_WHERE = "deletedAt IS NULL";

export function mapAttachmentRow(row: AttachmentRow): AttachmentResponse {
  return {
    id: row.id,
    recordId: row.recordId,
    kind: row.kind as AttachmentResponse["kind"],
    label: row.label,
    filename: row.filename,
    mimeType: row.mimeType,
    size: Number(row.size),
    localPath: row.localPath,
    createdAt: toIsoDateTime(row.createdAt),
    deletedAt: row.deletedAt ? toIsoDateTime(row.deletedAt) : null,
  };
}
