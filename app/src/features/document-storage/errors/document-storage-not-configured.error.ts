export class DocumentStorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Configure a pasta raiz em Configurações → Sync de Anexos e Recibos → Local Storage",
    );
    this.name = "DocumentStorageNotConfiguredError";
  }
}
