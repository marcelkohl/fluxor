export function removeAccents(value: string): string {
  return value
    .replace(/[ªº]/g, (char) => (char === "ª" ? "a" : "o"))
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function sanitizePathSegment(value: string): string {
  const withoutAccents = removeAccents(value)
    .trim()
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return withoutAccents || "item";
}

export function sanitizeFilenameBase(value: string): string {
  const withoutAccents = removeAccents(value)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return withoutAccents || "arquivo";
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return "";
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

export function getFilenameBase(filename: string): string {
  const extension = getFileExtension(filename);
  if (!extension) {
    return filename;
  }
  return filename.slice(0, -(extension.length + 1));
}
