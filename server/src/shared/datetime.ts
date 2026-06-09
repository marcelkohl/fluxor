export function nowIso(): string {
  return new Date().toISOString();
}

/** Formato aceito por colunas MariaDB `DATETIME(3)`. */
export function toMysqlDateTime(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${pad(date.getUTCMilliseconds(), 3)}`;
}

export function nowMysql(): string {
  return toMysqlDateTime(new Date());
}

export function toIsoDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  return value.slice(0, 10);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function toIsoDateTime(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value.includes("T")) {
    return new Date(value).toISOString();
  }

  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}
