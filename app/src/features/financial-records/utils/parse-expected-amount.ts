export function parseExpectedAmountToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100);
}

export function formatCentsInputPreview(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
