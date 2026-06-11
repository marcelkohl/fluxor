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
import {
  ATTACHMENT_UPLOADING_MESSAGE,
  ATTACH_UNSAVED_RECORD_MESSAGE,
  type AttachmentOperationStateListener,
} from "../types/attachment-operation-state";
import { guessMimeType } from "../utils/mime-type";
import { getFilenameBase } from "../utils/path-sanitizer";

export interface PickAndAttachFileInput {
  recordId: string;
  kind: AttachmentKind;
  walletName: string;
  recordDescription: string;
  dueDate: string;
}

export interface PickAndAttachFileOptions {
  onStateChange?: AttachmentOperationStateListener;
}

function assertSavedRecord(recordId: string): void {
  if (!recordId.trim()) {
    throw new Error(ATTACH_UNSAVED_RECORD_MESSAGE);
  }
}

export async function pickAndAttachFileToRecord(
  input: PickAndAttachFileInput,
  options?: PickAndAttachFileOptions,
): Promise<Attachment | null> {
  if (!isTauri()) {
    throw new DesktopOnlyStorageError();
  }

  assertSavedRecord(input.recordId);

  options?.onStateChange?.({ phase: "selecting" });

  const selected = await open({
    multiple: false,
    title:
      input.kind === "document"
        ? "Selecionar documento"
        : "Selecionar comprovante",
  });

  if (!selected || Array.isArray(selected)) {
    options?.onStateChange?.({ phase: "idle" });
    return null;
  }

  return attachFileFromPath(
    {
      ...input,
      sourcePath: selected,
    },
    options,
  );
}

export interface AttachFileFromPathInput extends PickAndAttachFileInput {
  sourcePath: string;
}

export async function attachFileFromPath(
  input: AttachFileFromPathInput,
  options?: PickAndAttachFileOptions,
): Promise<Attachment> {
  assertSavedRecord(input.recordId);

  options?.onStateChange?.({
    phase: "uploading",
    message: ATTACHMENT_UPLOADING_MESSAGE,
    pendingFilename: getSourceFilenameFromPath(input.sourcePath),
  });

  const storage = resolveStorageProvider();
  const sourceFilename = getSourceFilenameFromPath(input.sourcePath);

  const stored = await storage.storeFile({
    sourcePath: input.sourcePath,
    walletName: input.walletName,
    dueDate: input.dueDate,
    recordDescription: input.recordDescription,
    sourceFilename,
    kind: input.kind,
  });

  return createAttachment({
    recordId: input.recordId,
    kind: input.kind,
    filename: sourceFilename,
    mimeType: guessMimeType(sourceFilename),
    size: stored.size,
    localPath: stored.localPath,
    label: getFilenameBase(sourceFilename),
  });
}
