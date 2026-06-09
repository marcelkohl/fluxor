export class FinancialRecordNotFoundError extends Error {
  constructor(id?: string) {
    super(
      id ? `Financial record not found: ${id}` : "Financial record not found",
    );
    this.name = "FinancialRecordNotFoundError";
  }
}
