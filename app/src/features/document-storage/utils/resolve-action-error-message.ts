function extractMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return null;
}

function isFilesystemPermissionError(message: string): boolean {
  return /forbidden|denied|not allowed|scope|permission|permissão|acesso negado|mkdir:|write:|copy:/i.test(
    message,
  );
}

export function resolveAttachmentActionErrorMessage(
  error: unknown,
  fallback = "Não foi possível anexar o arquivo.",
): string {
  const message = extractMessage(error);
  if (!message) {
    return fallback;
  }

  if (isFilesystemPermissionError(message)) {
    return "Sem permissão para gravar na pasta configurada.";
  }

  return message;
}
