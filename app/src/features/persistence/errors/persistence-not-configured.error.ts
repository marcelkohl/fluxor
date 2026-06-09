export class PersistenceNotConfiguredError extends Error {
  constructor() {
    super("Persistence not configured");
    this.name = "PersistenceNotConfiguredError";
  }
}
