export class RemoteFeatureNotSupportedError extends Error {
  constructor(feature: string) {
    super(`Recurso não disponível no modo remoto: ${feature}`);
    this.name = "RemoteFeatureNotSupportedError";
  }
}
