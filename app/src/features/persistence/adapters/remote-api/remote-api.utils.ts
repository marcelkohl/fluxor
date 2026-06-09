import type { PaginatedListResponse } from "@fluxor/contracts";

export function unwrapList<T>(
  response: T[] | PaginatedListResponse<T>,
): T[] {
  return Array.isArray(response) ? response : response.items;
}

export function buildQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
