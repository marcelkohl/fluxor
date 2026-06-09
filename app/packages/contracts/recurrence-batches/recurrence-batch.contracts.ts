import type { IsoDate, IsoDateTime } from "../common/dates";
import type { EntityId } from "../common/ids";

export interface CreateRecurrenceBatchRequest {
  ruleDescription: string;
  startDate: IsoDate;
  endDate?: IsoDate | null;
  occurrenceCount: number;
}

export interface RecurrenceBatchResponse {
  id: EntityId;
  ruleDescription: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  occurrenceCount: number;
  createdAt: IsoDateTime;
}
