export class DesktopOnlyStorageError extends Error {
  constructor(
    message = "Seleção de arquivos disponível apenas no aplicativo desktop nesta etapa.",
  ) {
    super(message);
    this.name = "DesktopOnlyStorageError";
  }
}
