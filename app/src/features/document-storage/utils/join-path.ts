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

  const first = filtered[0];
  const isAbsoluteUnix = first.startsWith("/");
  const windowsDriveMatch = /^([A-Za-z]:)[/\\]?/.exec(first);
  const usesBackslash =
    windowsDriveMatch != null || filtered.some((segment) => segment.includes("\\"));
  const separator = usesBackslash ? "\\" : "/";

  const parts = filtered
    .flatMap((segment) => segment.split(/[/\\]+/))
    .filter(Boolean);

  if (isAbsoluteUnix) {
    return `/${parts.join(separator)}`;
  }

  if (windowsDriveMatch) {
    const drive = windowsDriveMatch[1];
    const drivePrefix = `${drive}${separator}`;
    const remainder = first.slice(windowsDriveMatch[0].length);
    const firstParts = remainder
      ? remainder.split(/[/\\]+/).filter(Boolean)
      : [];
    const otherParts = filtered
      .slice(1)
      .flatMap((segment) => segment.split(/[/\\]+/))
      .filter(Boolean);

    return `${drivePrefix}${[...firstParts, ...otherParts].join(separator)}`;
  }

  return parts.join(separator);
}
