import type {
  FinancialRecordType,
  ListFinancialRecordsRequest,
  ListFinancialRecordsResponse,
  StoredStatus,
} from "@fluxor/contracts";
import type { FinancialRecordRepositoryPort } from "../../persistence/ports/financial-record-repository.port.js";
import { isValidIsoDate } from "../../shared/datetime.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";

const RECORD_TYPES: FinancialRecordType[] = ["payable", "receivable"];
const STORED_STATUSES: StoredStatus[] = ["pending", "completed"];

export class ListFinancialRecordsUseCase {
  constructor(private readonly records: FinancialRecordRepositoryPort) {}

  execute(request?: ListFinancialRecordsRequest): Promise<ListFinancialRecordsResponse> {
    if (request?.type && !RECORD_TYPES.includes(request.type)) {
      throw new FinancialRecordValidationError(
        "validation_error",
        "type must be payable or receivable",
      );
    }

    if (request?.status && !STORED_STATUSES.includes(request.status)) {
      throw new FinancialRecordValidationError(
        "validation_error",
        "status must be pending or completed",
      );
    }

    if (request?.startDate && !isValidIsoDate(request.startDate)) {
      throw new FinancialRecordValidationError(
        "invalid_date",
        "startDate must be a valid ISO date (YYYY-MM-DD)",
      );
    }

    if (request?.endDate && !isValidIsoDate(request.endDate)) {
      throw new FinancialRecordValidationError(
        "invalid_date",
        "endDate must be a valid ISO date (YYYY-MM-DD)",
      );
    }

    return this.records.list(request);
  }
}
