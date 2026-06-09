export class FinancialRecordCanceledError extends Error {
  constructor() {
    super("Record is canceled");
    this.name = "FinancialRecordCanceledError";
  }
}
