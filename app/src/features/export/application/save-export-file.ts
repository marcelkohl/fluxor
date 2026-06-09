import { isTauri } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, writeTextFile } from "@tauri-apps/plugin-fs";

async function downloadExportFileInBrowser(
  content: BlobPart,
  filename: string,
  mimeType: string,
): Promise<void> {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toUint8Array(content: BlobPart): Uint8Array {
  if (content instanceof Uint8Array) {
    return content;
  }

  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }

  throw new Error("Conteúdo PDF inválido para exportação");
}

export async function saveExportFile(
  content: BlobPart,
  defaultFilename: string,
  format: "csv" | "pdf",
): Promise<string | null> {
  if (isTauri()) {
    const selectedPath = await save({
      defaultPath: defaultFilename,
      filters: [
        {
          name: format === "csv" ? "CSV" : "PDF",
          extensions: [format],
        },
      ],
    });

    if (!selectedPath) {
      return null;
    }

    if (format === "csv") {
      await writeTextFile(selectedPath, String(content));
    } else {
      await writeFile(selectedPath, toUint8Array(content));
    }

    return selectedPath;
  }

  const mimeType =
    format === "csv" ? "text/csv;charset=utf-8" : "application/pdf";

  await downloadExportFileInBrowser(content, defaultFilename, mimeType);
  return defaultFilename;
}
