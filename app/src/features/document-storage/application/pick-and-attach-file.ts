import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { createAttachment } from "@/features/financial-records/application";
import type {
  Attachment,
  AttachmentKind,
} from "@/features/financial-records/domain";

import {
  getSourceFilenameFromPath,
  resolveStorageProvider,
} from "../adapters/local-folder/local-folder-storage.provider";
import { DesktopOnlyStorageError } from "../errors/desktop-only-storage.error";
import { getFilenameBase } from "../utils/path-sanitizer";

export interface PickAndAttachFileInput {
  recordId: string;
  kind: AttachmentKind;
  walletName: string;
  recordDescription: string;
  dueDate: string;
}

export async function pickAndAttachFileToRecord(
  input: PickAndAttachFileInput,
): Promise<Attachment | null> {
  if (!isTauri()) {
    throw new DesktopOnlyStorageError();
  }

  const selected = await open({
    multiple: false,
    title:
      input.kind === "document"
        ? "Selecionar documento"
        : "Selecionar comprovante",
  });

  if (!selected || Array.isArray(selected)) {
    return null;
  }

  return attachFileFromPath({
    ...input,
    sourcePath: selected,
  });
}

export interface AttachFileFromPathInput extends PickAndAttachFileInput {
  sourcePath: string;
}

export async function attachFileFromPath(
  input: AttachFileFromPathInput,
): Promise<Attachment> {
  const storage = resolveStorageProvider();
  const sourceFilename = getSourceFilenameFromPath(input.sourcePath);

  const stored = await storage.storeFile({
    sourcePath: input.sourcePath,
    walletName: input.walletName,
    dueDate: input.dueDate,
    recordDescription: input.recordDescription,
    sourceFilename,
  });

  return createAttachment({
    recordId: input.recordId,
    kind: input.kind,
    filename: stored.filename,
    mimeType: stored.mimeType,
    size: stored.size,
    localPath: stored.localPath,
    label: getFilenameBase(sourceFilename),
  });
}
