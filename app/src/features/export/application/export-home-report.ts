import { generateHomeCsv } from "../csv/generate-home-csv";
import type { HomeExportFormat, HomeExportInput } from "../types";
import { buildHomeExportPayload } from "./build-home-export-payload";
import { saveExportFile } from "./save-export-file";

export async function exportHomeReport(
  input: HomeExportInput,
  format: HomeExportFormat,
): Promise<string | null> {
  const payload = buildHomeExportPayload(input);
  const defaultFilename = `${payload.filenameBase}.${format}`;

  if (format === "csv") {
    const csv = generateHomeCsv(payload);
    return saveExportFile(csv, defaultFilename, "csv");
  }

  const { generateHomePdf } = await import("../pdf/generate-home-pdf");
  const pdf = generateHomePdf(payload);
  return saveExportFile(pdf, defaultFilename, "pdf");
}
