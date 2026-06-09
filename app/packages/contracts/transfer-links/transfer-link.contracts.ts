import type { IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";

export interface CreateTransferLinkRequest {
  sourceRecordId: EntityId;
  targetRecordId: EntityId;
}

export interface TransferLinkResponse {
  id: EntityId;
  sourceRecordId: EntityId;
  targetRecordId: EntityId;
  createdAt: IsoDateTime;
}
