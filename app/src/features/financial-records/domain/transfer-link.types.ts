export interface TransferLink {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  createdAt: string;
}

export interface CreateTransferLinkData {
  sourceRecordId: string;
  targetRecordId: string;
}
