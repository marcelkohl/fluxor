export interface StorageProviderValidationPort {
  validateAccess(rootPath: string): Promise<void>;
}
