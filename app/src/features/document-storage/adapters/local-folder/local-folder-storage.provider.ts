import { isTauri } from "@tauri-apps/api/core";

import { DesktopOnlyStorageError } from "../../errors/desktop-only-storage.error";
import { DocumentStorageAccessError } from "../../errors/document-storage-access.error";
import { DocumentStorageNotConfiguredError } from "../../errors/document-storage-not-configured.error";
import { StorageProviderValidationError } from "../../errors/storage-provider-validation.error";
import type {
  StorageProviderPort,
  StoreFileInput,
  StoreFileResult,
} from "../../ports/storage-provider.port";
import { getDocumentStorageConfig } from "../../services/document-storage-config.service";
import { validateStorageProviderAccess } from "../../services/resolve-storage-provider-validation.service";
import {
  buildAttachmentStoragePath,
  buildCollisionFilename,
} from "../../utils/build-attachment-storage-path";
import { joinPath, joinPathSegments } from "../../utils/join-path";
import { guessMimeType } from "../../utils/mime-type";
import {
  attachmentPathExistsViaRust,
  copyAttachmentFileViaRust,
  removeAttachmentFileViaRust,
  statAttachmentFileViaRust,
} from "./local-folder-rust-io";

const LOCAL_STORAGE_PROVIDER_ID = "local-storage";

function extractMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "";
}

function isStoragePermissionError(message: string): boolean {
  return /forbidden|denied|not allowed|scope|permission|permissão|acesso negado|mkdir:|write:|copy:|remove:/i.test(
    message,
  );
}

function mapDeleteFileError(error: unknown): never {
  if (
    error instanceof DesktopOnlyStorageError ||
    error instanceof DocumentStorageAccessError
  ) {
    throw error;
  }

  const message = extractMessage(error);
  if (message && isStoragePermissionError(message)) {
    throw new DocumentStorageAccessError(
      "Sem permissão para remover o arquivo físico na pasta configurada.",
    );
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(message || "Não foi possível remover o arquivo físico.");
}

function mapStoreFileError(error: unknown): never {
  if (
    error instanceof DocumentStorageNotConfiguredError ||
    error instanceof DesktopOnlyStorageError ||
    error instanceof DocumentStorageAccessError
  ) {
    throw error;
  }

  const message = extractMessage(error);
  if (message && isStoragePermissionError(message)) {
    throw new DocumentStorageAccessError();
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(message || "Não foi possível copiar o arquivo.");
}

async function resolveUniqueDestinationPath(
  rootFolderPath: string,
  relativeDir: string,
  filename: string,
): Promise<{ destinationPath: string; filename: string }> {
  for (let attempt = 1; attempt <= 999; attempt += 1) {
    const candidateFilename = buildCollisionFilename(filename, attempt);
    const destinationPath = joinPath(
      joinPath(rootFolderPath, relativeDir),
      candidateFilename,
    );

    if (!(await attachmentPathExistsViaRust(destinationPath))) {
      return { destinationPath, filename: candidateFilename };
    }
  }

  throw new Error("Não foi possível gerar nome único para o arquivo");
}

async function assertConfiguredStorageAccess(): Promise<string> {
  const config = getDocumentStorageConfig();
  if (!config) {
    throw new DocumentStorageNotConfiguredError();
  }

  try {
    await validateStorageProviderAccess(
      LOCAL_STORAGE_PROVIDER_ID,
      config.rootFolderPath,
    );
  } catch (error) {
    if (error instanceof StorageProviderValidationError) {
      throw new DocumentStorageAccessError();
    }

    if (isStoragePermissionError(extractMessage(error))) {
      throw new DocumentStorageAccessError();
    }

    throw error;
  }

  return config.rootFolderPath;
}

export class LocalFolderStorageProvider implements StorageProviderPort {
  async storeFile(input: StoreFileInput): Promise<StoreFileResult> {
    if (!isTauri()) {
      throw new DesktopOnlyStorageError();
    }

    try {
      const rootFolderPath = await assertConfiguredStorageAccess();

      const pathInfo = buildAttachmentStoragePath({
        walletName: input.walletName,
        dueDate: input.dueDate,
        recordDescription: input.recordDescription,
        sourceFilename: input.sourceFilename,
        kind: input.kind,
      });

      const relativeDir = joinPathSegments(
        pathInfo.walletSegment,
        pathInfo.yearSegment,
        pathInfo.monthSegment,
      );

      const { destinationPath, filename } = await resolveUniqueDestinationPath(
        rootFolderPath,
        relativeDir,
        pathInfo.filename,
      );

      await copyAttachmentFileViaRust(input.sourcePath, destinationPath);

      const copied = await attachmentPathExistsViaRust(destinationPath);
      if (!copied) {
        throw new Error("Arquivo não encontrado após a cópia.");
      }

      const size = await statAttachmentFileViaRust(destinationPath);
      if (size <= 0) {
        throw new Error("Arquivo copiado está vazio.");
      }

      return {
        localPath: destinationPath,
        storedFilename: filename,
        size,
        mimeType: guessMimeType(filename),
      };
    } catch (error) {
      return mapStoreFileError(error);
    }
  }

  async fileExists(localPath: string): Promise<boolean> {
    if (!isTauri()) {
      return false;
    }

    const normalizedPath = localPath.trim();
    if (!normalizedPath) {
      return false;
    }

    try {
      return await attachmentPathExistsViaRust(normalizedPath);
    } catch {
      return false;
    }
  }

  async deleteFile(localPath: string): Promise<void> {
    if (!isTauri()) {
      throw new DesktopOnlyStorageError();
    }

    const normalizedPath = localPath.trim();
    if (!normalizedPath) {
      return;
    }

    const exists = await this.fileExists(normalizedPath);
    if (!exists) {
      return;
    }

    try {
      await removeAttachmentFileViaRust(normalizedPath);
    } catch (error) {
      mapDeleteFileError(error);
    }
  }
}

export class UnavailableStorageProvider implements StorageProviderPort {
  async storeFile(): Promise<StoreFileResult> {
    throw new DesktopOnlyStorageError();
  }

  async fileExists(): Promise<boolean> {
    return false;
  }

  async deleteFile(_localPath: string): Promise<void> {
    throw new DesktopOnlyStorageError(
      "Exclusão física disponível apenas no aplicativo desktop.",
    );
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
  kind: "document" | "receipt";
}): string {
  const sourceFilename = input.sourceFilename ?? "documento.pdf";
  const pathInfo = buildAttachmentStoragePath({
    walletName: input.walletName,
    dueDate: input.dueDate,
    recordDescription: input.recordDescription,
    sourceFilename,
    kind: input.kind,
  });

  return `/${pathInfo.relativePath}`;
}
