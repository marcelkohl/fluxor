/**
 * Normaliza a URL base do servidor remoto.
 * Remove espaços, barra final e sufixo `/api/v1`.
 */
export function normalizeRemoteBaseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    let candidate = trimmed.replace(/\/+$/, "");
    candidate = candidate.replace(/\/api\/v1\/?$/i, "");
    candidate = candidate.replace(/\/+$/, "");

    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const pathname = parsed.pathname.replace(/\/+$/, "");
    if (pathname) {
      return `${parsed.origin}${pathname}`;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}
