export function formatLastSyncLabel(lastSyncAt: string | null): string {
  if (!lastSyncAt) {
    return "Nunca";
  }

  const date = new Date(lastSyncAt);
  if (Number.isNaN(date.getTime())) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatStorageProviderStatusLabel(
  status: "active" | "disabled" | "error" | "syncing",
): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "disabled":
      return "Não disponível";
    case "error":
      return "Erro";
    case "syncing":
      return "Sincronizando";
    default:
      return status;
  }
}
