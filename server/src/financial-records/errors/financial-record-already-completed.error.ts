export class FinancialRecordAlreadyCompletedError extends Error {
  constructor() {
    super("Record is already completed");
    this.name = "FinancialRecordAlreadyCompletedError";
  }
}
