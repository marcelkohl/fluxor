export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatShortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function formatWeekdayName(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(
    new Date(year, month - 1, day),
  );

  return label.replace(/-feira$/, "");
}

export function formatMonthYear(year: number, month: number): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isToday(date: string, referenceDate: string): boolean {
  return date === referenceDate;
}

export function isSameMonth(
  date: string,
  year: number,
  month: number,
): boolean {
  const [recordYear, recordMonth] = date.split("-").map(Number);
  return recordYear === year && recordMonth === month;
}
