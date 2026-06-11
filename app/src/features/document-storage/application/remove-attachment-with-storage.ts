import { isTauri } from "@tauri-apps/api/core";

import {
  getAttachmentById,
  removeAttachment,
} from "@/features/financial-records/application";

import { resolveStorageProvider } from "../adapters/local-folder/local-folder-storage.provider";

export interface RemoveAttachmentCompletelyResult {
  warning?: string;
}

const FILE_MISSING_WARNING =
  "Arquivo físico não encontrado. O vínculo foi removido do Fluxor.";

async function deletePhysicalFileIfPresent(
  localPath: string,
): Promise<{ missing: boolean }> {
  const storage = resolveStorageProvider();
  const exists = await storage.fileExists(localPath);

  if (!exists) {
    return { missing: true };
  }

  await storage.deleteFile(localPath);
  return { missing: false };
}

export async function removeAttachmentCompletely(
  attachmentId: string,
): Promise<RemoveAttachmentCompletelyResult> {
  const attachment = await getAttachmentById(attachmentId);
  let warning: string | undefined;

  if (isTauri()) {
    const localPath = attachment.localPath.trim();

    if (!localPath) {
      warning = FILE_MISSING_WARNING;
    } else {
      const { missing } = await deletePhysicalFileIfPresent(localPath);
      if (missing) {
        warning = FILE_MISSING_WARNING;
      }
    }
  }

  await removeAttachment(attachmentId);

  return { warning };
}
