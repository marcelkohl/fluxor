import type { RecurrenceRule } from "@fluxor/contracts";

import { formatIsoDatePtBr } from "@/components/admin-form";

import {
  RECURRENCE_FREQUENCY_UNIT_LABELS,
  RECURRENCE_WEEKDAY_LABELS,
} from "../domain/recurrence-rule.types";

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

function formatWeekdayList(weekDays: number[]): string {
  const sorted = [...weekDays].sort((left, right) => {
    const order = (day: number) => (day === 0 ? 7 : day);
    return order(left) - order(right);
  });
  const labels = sorted.map((day) => RECURRENCE_WEEKDAY_LABELS[day]?.toLowerCase() ?? "");

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

  const unit = RECURRENCE_FREQUENCY_UNIT_LABELS[rule.frequency];
  return `A cada ${rule.interval} ${unit}`;
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
    const prefix =
      rule.interval === 1
        ? `Todo dia ${monthDay} do mês`
        : `A cada ${rule.interval} meses, dia ${monthDay}`;

    return prefix;
  }

  const [, month, day] = startDate.split("-");
  const monthName = MONTH_NAMES[Number.parseInt(month ?? "1", 10) - 1] ?? month;

  if (rule.interval === 1) {
    return `Todo ano em ${Number.parseInt(day ?? "1", 10)} de ${monthName}`;
  }

  return `A cada ${rule.interval} anos, ${Number.parseInt(day ?? "1", 10)} de ${monthName}`;
}

function formatEnd(rule: RecurrenceRule): string {
  if (rule.end.type === "count") {
    return `${rule.end.count} ocorrências`;
  }

  return `até ${formatIsoDatePtBr(rule.end.date)}`;
}

export function formatRecurrenceRuleSummary(
  rule: RecurrenceRule,
  startDate: string,
): string {
  const core = formatFrequencyCore(rule, startDate);
  const end = formatEnd(rule);
  return `${core}, ${end}`;
}

export function createDefaultRecurrenceRule(startDate: string): RecurrenceRule {
  const day = Number.parseInt(startDate.split("-")[2] ?? "1", 10);
  const weekday = new Date(`${startDate}T12:00:00`).getDay();

  return {
    interval: 1,
    frequency: "monthly",
    monthDay: day,
    weekDays: [weekday],
    end: { type: "count", count: 12 },
  };
}
