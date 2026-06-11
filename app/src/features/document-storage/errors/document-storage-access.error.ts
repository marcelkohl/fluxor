export class DocumentStorageAccessError extends Error {
  constructor(
    message = "Sem permissão para gravar na pasta configurada.",
  ) {
    super(message);
    this.name = "DocumentStorageAccessError";
  }
}
