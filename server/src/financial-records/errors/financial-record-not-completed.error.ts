export class FinancialRecordNotCompletedError extends Error {
  constructor() {
    super("Record is not completed");
    this.name = "FinancialRecordNotCompletedError";
  }
}
