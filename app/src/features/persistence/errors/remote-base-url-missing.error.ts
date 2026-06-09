export class RemoteBaseUrlMissingError extends Error {
  constructor() {
    super("URL do servidor remoto não configurada");
    this.name = "RemoteBaseUrlMissingError";
  }
}
