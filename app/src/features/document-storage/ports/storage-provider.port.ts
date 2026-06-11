export interface StoreFileInput {
  sourcePath: string;
  walletName: string;
  dueDate: string;
  recordDescription: string;
  sourceFilename: string;
}

export interface StoreFileResult {
  localPath: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface StorageProviderPort {
  storeFile(input: StoreFileInput): Promise<StoreFileResult>;
  fileExists(localPath: string): Promise<boolean>;
  deleteFile(localPath: string): Promise<void>;
}
