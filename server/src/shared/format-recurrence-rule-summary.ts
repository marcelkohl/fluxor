import type { RecurrenceRule } from "@fluxor/contracts";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const WEEKDAY_LABELS: Record<number, string> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sáb",
};

const UNIT_LABELS: Record<RecurrenceRule["frequency"], string> = {
  daily: "dias",
  weekly: "semanas",
  monthly: "meses",
  yearly: "anos",
};

function formatIsoDatePtBr(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatWeekdayList(weekDays: number[]): string {
  const sorted = [...weekDays].sort((left, right) => {
    const order = (day: number) => (day === 0 ? 7 : day);
    return order(left) - order(right);
  });
  const labels = sorted.map((day) => WEEKDAY_LABELS[day] ?? "");

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} e ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

function formatIntervalPrefix(rule: RecurrenceRule): string {
  if (rule.interval === 1) {
    return "";
  }

  return `A cada ${rule.interval} ${UNIT_LABELS[rule.frequency]}`;
}

function formatFrequencyCore(rule: RecurrenceRule, startDate: string): string {
  if (rule.frequency === "daily") {
    if (rule.interval === 1) {
      return "Todos os dias";
    }
    return formatIntervalPrefix(rule);
  }

  if (rule.frequency === "weekly") {
    const weekDays = rule.weekDays?.length
      ? rule.weekDays
      : [new Date(`${startDate}T12:00:00`).getDay()];
    const daysLabel = formatWeekdayList(weekDays);
    const prefix = formatIntervalPrefix(rule);

    if (prefix) {
      return `${prefix}, ${daysLabel}`;
    }

    return `Semanal, ${daysLabel}`;
  }

  if (rule.frequency === "monthly") {
    const monthDay = rule.monthDay ?? Number.parseInt(startDate.split("-")[2] ?? "1", 10);
    if (rule.interval === 1) {
      return `Todo dia ${monthDay} do mês`;
    }
    return `A cada ${rule.interval} meses, dia ${monthDay}`;
  }

  const [, month, day] = startDate.split("-");
  const monthName = MONTH_NAMES[Number.parseInt(month ?? "1", 10) - 1] ?? month;

  if (rule.interval === 1) {
    return `Todo ano em ${Number.parseInt(day ?? "1", 10)} de ${monthName}`;
  }

  return `A cada ${rule.interval} anos, ${Number.parseInt(day ?? "1", 10)} de ${monthName}`;
}

export function formatRecurrenceRuleSummary(
  rule: RecurrenceRule,
  startDate: string,
): string {
  const core = formatFrequencyCore(rule, startDate);
  const end =
    rule.end.type === "count"
      ? `${rule.end.count} ocorrências`
      : `até ${formatIsoDatePtBr(rule.end.date)}`;

  return `${core}, ${end}`;
}
