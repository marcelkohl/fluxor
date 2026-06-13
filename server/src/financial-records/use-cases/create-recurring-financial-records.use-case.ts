import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  CreateRecurringFinancialRecordsRequest,
  CreateRecurringFinancialRecordsResponse,
  FinancialRecordResponse,
  RecurrenceRule,
} from "@fluxor/contracts";
import { MariadbFinancialRecordHistoryRepository } from "../../persistence/adapters/mariadb/mariadb-financial-record-history.repository.js";
import {
  ACTIVE_FINANCIAL_RECORD_WHERE,
  FINANCIAL_RECORD_SELECT_COLUMNS,
  mapFinancialRecordRow,
  type FinancialRecordRow,
} from "../../persistence/adapters/mariadb/financial-record-row.mapper.js";
import { getPool } from "../../persistence/adapters/mariadb/connection.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { nowMysql } from "../../shared/datetime.js";
import { formatRecurrenceRuleSummary } from "../../shared/format-recurrence-rule-summary.js";
import {
  generateRecurringDueDates,
  validateRecurrenceRule,
} from "../../shared/generate-recurring-due-dates.js";
import { generateId } from "../../shared/id.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";
import { validateCreateFinancialRecordInput } from "../validation/validate-financial-record-input.js";

function assertValidRecurrenceRule(rule: RecurrenceRule): void {
  try {
    validateRecurrenceRule(rule);
  } catch (error) {
    throw new FinancialRecordValidationError(
      "validation_error",
      error instanceof Error ? error.message : "Invalid recurrence rule",
    );
  }
}

export class CreateRecurringFinancialRecordsUseCase {
  constructor(private readonly persistence: PersistenceProvider) {}

  async execute(
    request: CreateRecurringFinancialRecordsRequest,
  ): Promise<CreateRecurringFinancialRecordsResponse> {
    await validateCreateFinancialRecordInput(this.persistence, request.record);
    assertValidRecurrenceRule(request.recurrence);

    const dueDates = generateRecurringDueDates(
      request.record.dueDate,
      request.recurrence,
    );

    if (dueDates.length < 2) {
      throw new FinancialRecordValidationError(
        "validation_error",
        "Recurrence must generate at least 2 occurrences",
      );
    }

    const ruleDescription = formatRecurrenceRuleSummary(
      request.recurrence,
      request.record.dueDate,
    );

    const pool = getPool();
    const connection = await pool.getConnection();
    const now = nowMysql();
    const batchId = generateId();
    const history =
      this.persistence.financialRecordHistory as MariadbFinancialRecordHistoryRepository;

    try {
      await connection.beginTransaction();

      await connection.execute<ResultSetHeader>(
        `INSERT INTO recurrence_batch (
          id, ruleDescription, startDate, endDate, occurrenceCount, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          batchId,
          ruleDescription,
          dueDates[0],
          dueDates[dueDates.length - 1],
          dueDates.length,
          now,
        ],
      );

      for (let index = 0; index < dueDates.length; index += 1) {
        const recordId = generateId();
        const recurrenceIndex = index + 1;
        const alertEnabled = request.record.alertEnabled ?? false;

        await connection.execute<ResultSetHeader>(
          `INSERT INTO financial_record (
            id, walletId, type, description, payeeId, categoryId, dueDate,
            expectedAmount, effectiveDate, effectiveAmount, recordNote, paymentNote,
            storedStatus, recurrenceGroupId, recurrenceIndex, alertEnabled, alertOffset,
            transferGroupId, createdAt, updatedAt, deletedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL, ?, ?, NULL)`,
          [
            recordId,
            request.record.walletId,
            request.record.type,
            request.record.description,
            request.record.payeeId ?? null,
            request.record.categoryId,
            dueDates[index],
            request.record.expectedAmount,
            null,
            null,
            request.record.recordNote ?? null,
            null,
            batchId,
            recurrenceIndex,
            alertEnabled ? 1 : 0,
            request.record.alertOffset ?? null,
            now,
            now,
          ],
        );

        await history.appendEventOnConnection(
          connection,
          {
            recordId,
            eventType: "record_created",
            description: "Registro criado",
          },
          now,
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${FINANCIAL_RECORD_SELECT_COLUMNS}
       FROM financial_record
       WHERE recurrenceGroupId = ? AND ${ACTIVE_FINANCIAL_RECORD_WHERE}
       ORDER BY recurrenceIndex ASC`,
      [batchId],
    );

    const records = (rows as FinancialRecordRow[]).map(
      mapFinancialRecordRow,
    ) as FinancialRecordResponse[];

    return {
      batchId,
      records,
    };
  }
}
