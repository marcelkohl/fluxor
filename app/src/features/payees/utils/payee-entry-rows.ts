import type { EditableEntryRow } from "@/features/payees/components/PayeeInlineEntrySection";

export interface NormalizedEntryRow {
  rowId: string;
  type: string;
  value: string;
}

export function normalizeEntryRows(
  rows: EditableEntryRow[],
  sectionLabel: string,
): { rows: NormalizedEntryRow[]; error: string | null } {
  const normalized: NormalizedEntryRow[] = [];

  for (const row of rows) {
    const type = row.type.trim();
    const value = row.value.trim();
    const hasType = type.length > 0;
    const hasValue = value.length > 0;

    if (!hasType && !hasValue) {
      continue;
    }

    if (!hasType || !hasValue) {
      return {
        rows: [],
        error: `${sectionLabel}: preencha tipo e valor ou deixe a linha vazia.`,
      };
    }

    normalized.push({
      rowId: row.rowId,
      type,
      value,
    });
  }

  return { rows: normalized, error: null };
}
