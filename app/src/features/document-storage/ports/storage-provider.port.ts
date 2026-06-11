export interface StoreFileInput {
  sourcePath: string;
  walletName: string;
  dueDate: string;
  recordDescription: string;
  sourceFilename: string;
  kind: "document" | "receipt";
}

export interface StoreFileResult {
  localPath: string;
  /** Nome do arquivo físico gerado (com prefixo doc-/rec-). */
  storedFilename: string;
  size: number;
  mimeType: string;
}

export interface StorageProviderPort {
  storeFile(input: StoreFileInput): Promise<StoreFileResult>;
  fileExists(localPath: string): Promise<boolean>;
  deleteFile(localPath: string): Promise<void>;
}
