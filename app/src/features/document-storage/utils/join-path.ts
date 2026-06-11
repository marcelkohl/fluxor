export function joinPath(basePath: string, relativePath: string): string {
  const usesBackslash = basePath.includes("\\");
  const separator = usesBackslash ? "\\" : "/";
  const normalizedBase = basePath.replace(/[/\\]+$/, "");
  const normalizedRelative = relativePath
    .split(/[/\\]+/)
    .filter(Boolean)
    .join(separator);

  return `${normalizedBase}${separator}${normalizedRelative}`;
}

export function joinPathSegments(...segments: string[]): string {
  const filtered = segments.filter(Boolean);
  if (filtered.length === 0) {
    return "";
  }

  const usesBackslash = filtered.some((segment) => segment.includes("\\"));
  const separator = usesBackslash ? "\\" : "/";

  return filtered
    .flatMap((segment) => segment.split(/[/\\]+/))
    .filter(Boolean)
    .join(separator);
}
