import {
  getFileExtension,
  sanitizeFilenameBase,
  sanitizePathSegment,
} from "./path-sanitizer";

export interface AttachmentStoragePathInput {
  walletName: string;
  dueDate: string;
  recordDescription: string;
  sourceFilename: string;
}

export interface AttachmentStoragePathResult {
  walletSegment: string;
  yearSegment: string;
  monthSegment: string;
  filename: string;
  relativePath: string;
}

function formatMonthFolderName(month: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(2020, month - 1, 1),
  );
}

function parseDueDate(dueDate: string): { year: number; month: number } {
  const [yearText, monthText] = dueDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Data de vencimento inválida para organização de anexos");
  }

  return { year, month };
}

export function buildAttachmentFilename(
  recordDescription: string,
  sourceFilename: string,
): string {
  const extension = getFileExtension(sourceFilename);
  const descriptionBase = sanitizeFilenameBase(recordDescription);
  return extension ? `${descriptionBase}.${extension}` : descriptionBase;
}

export function buildAttachmentStoragePath(
  input: AttachmentStoragePathInput,
): AttachmentStoragePathResult {
  const { year, month } = parseDueDate(input.dueDate);
  const walletSegment = sanitizePathSegment(input.walletName);
  const yearSegment = String(year);
  const monthSegment = sanitizePathSegment(formatMonthFolderName(month));
  const filename = buildAttachmentFilename(
    input.recordDescription,
    input.sourceFilename,
  );
  const relativePath = `${walletSegment}/${yearSegment}/${monthSegment}/${filename}`;

  return {
    walletSegment,
    yearSegment,
    monthSegment,
    filename,
    relativePath,
  };
}

export function buildCollisionFilename(
  filename: string,
  attempt: number,
): string {
  const extension = getFileExtension(filename);
  const base = extension
    ? filename.slice(0, -(extension.length + 1))
    : filename;

  if (attempt <= 1) {
    return filename;
  }

  const suffix = ` (${attempt})`;
  return extension ? `${base}${suffix}.${extension}` : `${base}${suffix}`;
}
