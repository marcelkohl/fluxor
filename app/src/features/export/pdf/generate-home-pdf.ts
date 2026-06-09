import { jsPDF } from "jspdf";

import type { HomeExportPayload } from "../types";

const PAGE_MARGIN = 14;
const LINE_HEIGHT = 5;
const FOOTER_HEIGHT = 12;
const COL_DATE = PAGE_MARGIN;
const COL_DESCRIPTION = 36;
const COL_VALUE = 118;
const COL_EFFECTIVE = 145;
const COL_NOTES = 152;
const DESCRIPTION_WIDTH = 54;

function ensureSpace(doc: jsPDF, y: number, required: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + required > pageHeight - PAGE_MARGIN - FOOTER_HEIGHT) {
    doc.addPage();
    return PAGE_MARGIN;
  }

  return y;
}

function drawSummary(doc: jsPDF, payload: HomeExportPayload, startY: number): number {
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo financeiro", PAGE_MARGIN, y);
  y += LINE_HEIGHT + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const line of payload.summaryLines) {
    y = ensureSpace(doc, y, LINE_HEIGHT);
    const labelX = PAGE_MARGIN + (line.indent ? 8 : 0);
    doc.text(line.label, labelX, y);
    doc.text(line.value, 110, y, { align: "right" });
    y += LINE_HEIGHT;
  }

  return y + 4;
}

function drawTableHeader(doc: jsPDF, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Data", COL_DATE, y);
  doc.text("Descrição", COL_DESCRIPTION, y);
  doc.text("Valor", COL_VALUE, y, { align: "right" });
  doc.text("Efetivado", COL_EFFECTIVE, y, { align: "right" });
  doc.text("Notas", COL_NOTES, y);
  return y + LINE_HEIGHT;
}

function drawTableRows(doc: jsPDF, payload: HomeExportPayload, startY: number): number {
  let y = startY;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const row of payload.rows) {
    const descriptionLines = doc.splitTextToSize(row.description, DESCRIPTION_WIDTH);
    const noteLines = row.notes
      ? doc.splitTextToSize(row.notes, 44)
      : [""];
    const rowHeight =
      Math.max(descriptionLines.length, noteLines.length, 1) * LINE_HEIGHT;

    y = ensureSpace(doc, y, rowHeight + 1);

    doc.text(row.date, COL_DATE, y);
    doc.text(descriptionLines, COL_DESCRIPTION, y);
    doc.text(row.expectedValue, COL_VALUE, y, { align: "right" });
    doc.text(row.effectiveValue, COL_EFFECTIVE, y, { align: "right" });
    doc.text(noteLines, COL_NOTES, y);

    y += rowHeight + 1;
  }

  return y;
}

function drawFooter(doc: jsPDF, payload: HomeExportPayload): void {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Quantidade de registros: ${payload.recordCount} | Gerado em: ${payload.generatedAtLabel}`,
      PAGE_MARGIN,
      pageHeight - 8,
    );
  }
}

export function generateHomePdf(payload: HomeExportPayload): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(payload.walletName, PAGE_MARGIN, y);
  y += LINE_HEIGHT + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Período: ${payload.periodLabel}`, PAGE_MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Gerado em: ${payload.generatedAtLabel}`, PAGE_MARGIN, y);
  y += LINE_HEIGHT + 3;

  y = drawSummary(doc, payload, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  y = ensureSpace(doc, y, LINE_HEIGHT + 4);
  doc.text("Registros", PAGE_MARGIN, y);
  y += LINE_HEIGHT + 2;

  y = drawTableHeader(doc, y);
  y = drawTableRows(doc, payload, y);
  drawFooter(doc, payload);

  return new Uint8Array(doc.output("arraybuffer"));
}
