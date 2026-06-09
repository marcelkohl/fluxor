export class RemoteProviderNotImplementedError extends Error {
  constructor() {
    super("Remote provider not implemented");
    this.name = "RemoteProviderNotImplementedError";
  }
}
