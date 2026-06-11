export class DesktopOnlyStorageError extends Error {
  constructor() {
    super(
      "Seleção de arquivos disponível apenas no aplicativo desktop nesta etapa.",
    );
    this.name = "DesktopOnlyStorageError";
  }
}
