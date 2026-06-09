export class FinancialRecordIsTransferError extends Error {
  constructor() {
    super("Transfer records use a dedicated flow");
    this.name = "FinancialRecordIsTransferError";
  }
}
