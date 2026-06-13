export class RecurrenceBatchNotFoundError extends Error {
  readonly code = "recurrence_batch_not_found" as const;

  constructor(batchId: string) {
    super("Recurrence batch not found");
    this.name = "RecurrenceBatchNotFoundError";
    this.message = `Recurrence batch not found: ${batchId}`;
  }
}
