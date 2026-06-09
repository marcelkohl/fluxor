import type { ApiErrorResponse } from "@fluxor/contracts";

import { ValidationError } from "@/features/database";

import { mapApiError } from "./map-api-error";

const API_PREFIX = "/api/v1";

export class RemoteApiClient {
  constructor(private readonly baseUrl: string) {}

  private buildUrl(path: string): string {
    const normalizedBase = this.baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${API_PREFIX}${normalizedPath}`;
  }

  async request<TResponse>(
    path: string,
    options: RequestInit = {},
  ): Promise<TResponse> {
    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;

    try {
      response = await fetch(this.buildUrl(path), {
        ...options,
        headers,
      });
    } catch {
      throw new ValidationError("Não foi possível conectar ao servidor remoto");
    }

    if (response.ok) {
      if (response.status === 204) {
        return undefined as TResponse;
      }

      const text = await response.text();
      if (!text) {
        return undefined as TResponse;
      }

      return JSON.parse(text) as TResponse;
    }

    let apiError: ApiErrorResponse | null = null;

    try {
      apiError = (await response.json()) as ApiErrorResponse;
    } catch {
      apiError = null;
    }

    throw mapApiError(apiError, response.status);
  }
}
