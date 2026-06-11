import { isTauri } from "@tauri-apps/api/core";
import { exists, mkdir, readFile, stat, writeFile } from "@tauri-apps/plugin-fs";

import { DocumentStorageNotConfiguredError } from "../../errors/document-storage-not-configured.error";
import { DesktopOnlyStorageError } from "../../errors/desktop-only-storage.error";
import type {
  StorageProviderPort,
  StoreFileInput,
  StoreFileResult,
} from "../../ports/storage-provider.port";
import { getDocumentStorageConfig } from "../../services/document-storage-config.service";
import {
  buildAttachmentStoragePath,
  buildCollisionFilename,
} from "../../utils/build-attachment-storage-path";
import { joinPath, joinPathSegments } from "../../utils/join-path";
import { guessMimeType } from "../../utils/mime-type";

async function resolveUniqueDestinationPath(
  rootFolderPath: string,
  relativeDir: string,
  filename: string,
): Promise<{ destinationPath: string; filename: string }> {
  for (let attempt = 1; attempt <= 999; attempt += 1) {
    const candidateFilename = buildCollisionFilename(filename, attempt);
    const destinationPath = joinPath(
      joinPathSegments(rootFolderPath, relativeDir),
      candidateFilename,
    );

    if (!(await exists(destinationPath))) {
      return { destinationPath, filename: candidateFilename };
    }
  }

  throw new Error("Não foi possível gerar nome único para o arquivo");
}

export class LocalFolderStorageProvider implements StorageProviderPort {
  async storeFile(input: StoreFileInput): Promise<StoreFileResult> {
    if (!isTauri()) {
      throw new DesktopOnlyStorageError();
    }

    const config = getDocumentStorageConfig();
    if (!config) {
      throw new DocumentStorageNotConfiguredError();
    }

    const pathInfo = buildAttachmentStoragePath({
      walletName: input.walletName,
      dueDate: input.dueDate,
      recordDescription: input.recordDescription,
      sourceFilename: input.sourceFilename,
    });

    const relativeDir = joinPathSegments(
      pathInfo.walletSegment,
      pathInfo.yearSegment,
      pathInfo.monthSegment,
    );

    const { destinationPath, filename } = await resolveUniqueDestinationPath(
      config.rootFolderPath,
      relativeDir,
      pathInfo.filename,
    );

    await mkdir(joinPath(config.rootFolderPath, relativeDir), {
      recursive: true,
    });

    const fileBytes = await readFile(input.sourcePath);
    await writeFile(destinationPath, fileBytes);

    const fileStat = await stat(destinationPath);

    return {
      localPath: destinationPath,
      filename,
      size: fileStat.size,
      mimeType: guessMimeType(filename),
    };
  }

  async fileExists(localPath: string): Promise<boolean> {
    if (!isTauri()) {
      return false;
    }

    return exists(localPath);
  }

  async deleteFile(_localPath: string): Promise<void> {
    // V2: soft delete only — arquivo físico permanece na pasta.
  }
}

export class UnavailableStorageProvider implements StorageProviderPort {
  async storeFile(): Promise<StoreFileResult> {
    throw new DesktopOnlyStorageError();
  }

  async fileExists(): Promise<boolean> {
    return false;
  }

  async deleteFile(): Promise<void> {
    // noop
  }
}

export function resolveStorageProvider(): StorageProviderPort {
  if (isTauri()) {
    return new LocalFolderStorageProvider();
  }

  return new UnavailableStorageProvider();
}

export function getSourceFilenameFromPath(sourcePath: string): string {
  const segments = sourcePath.split(/[/\\]+/);
  return segments[segments.length - 1] || "arquivo";
}

export function buildStoragePathPreview(input: {
  walletName: string;
  dueDate: string;
  recordDescription: string;
  sourceFilename?: string;
}): string {
  const sourceFilename = input.sourceFilename ?? "documento.pdf";
  const pathInfo = buildAttachmentStoragePath({
    walletName: input.walletName,
    dueDate: input.dueDate,
    recordDescription: input.recordDescription,
    sourceFilename,
  });

  return `/${pathInfo.relativePath}`;
}
