export class PayeeNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Payee not found: ${id}` : "Payee not found");
    this.name = "PayeeNotFoundError";
  }
}
