import type { HomeExportPayload } from "../types";

const CSV_SEPARATOR = ";";

function escapeCsvField(value: string): string {
  if (
    value.includes(CSV_SEPARATOR) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function csvRow(values: string[]): string {
  return values.map(escapeCsvField).join(CSV_SEPARATOR);
}

export function generateHomeCsv(payload: HomeExportPayload): string {
  const lines: string[] = [
    csvRow([payload.walletName]),
    csvRow(["Período", payload.periodLabel]),
    csvRow(["Gerado em", payload.generatedAtLabel]),
    "",
  ];

  for (const line of payload.summaryLines) {
    lines.push(
      csvRow([
        line.indent ? `  ${line.label}` : line.label,
        line.value,
      ]),
    );
  }

  lines.push("");
  lines.push(csvRow(["Data", "Descrição", "Valor", "Efetivado", "Notas"]));

  for (const row of payload.rows) {
    lines.push(
      csvRow([
        row.date,
        row.description,
        row.expectedValue,
        row.effectiveValue,
        row.notes,
      ]),
    );
  }

  lines.push("");
  lines.push(csvRow(["Quantidade de registros", String(payload.recordCount)]));
  lines.push(csvRow(["Gerado em", payload.generatedAtLabel]));

  return `\uFEFF${lines.join("\r\n")}`;
}
