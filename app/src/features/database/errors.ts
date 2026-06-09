export class DatabaseNotReadyError extends Error {
  constructor(message = "Banco SQLite não inicializado") {
    super(message);
    this.name = "DatabaseNotReadyError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
