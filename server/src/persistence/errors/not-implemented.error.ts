export class NotImplementedError extends Error {
  constructor(
    public readonly repository: string,
    public readonly method: string,
  ) {
    super(`Persistence not implemented: ${repository}.${method}`);
    this.name = "NotImplementedError";
  }
}

export async function notImplemented<T>(
  repository: string,
  method: string,
): Promise<T> {
  throw new NotImplementedError(repository, method);
}
