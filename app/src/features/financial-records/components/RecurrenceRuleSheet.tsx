import { useEffect, useState } from "react";

import type { RecurrenceRule } from "@fluxor/contracts";
import {
  DatePickerSheet,
  FormFieldRow,
  FormInputRow,
  FormSheetHeader,
  FormSheetPanel,
  formatIsoDatePtBr,
  OptionPickerSheet,
  SheetScaffold,
} from "@/components/admin-form";
import {
  MAX_RECURRENCE_OCCURRENCES,
  MIN_RECURRENCE_OCCURRENCES,
  RECURRENCE_FREQUENCY_OPTIONS,
  RECURRENCE_FREQUENCY_UNIT_LABELS,
  RECURRENCE_WEEKDAY_LABELS,
  RECURRENCE_WEEKDAY_OPTIONS,
} from "@/features/financial-records/domain/recurrence-rule.types";
import {
  createDefaultRecurrenceRule,
  formatRecurrenceRuleSummary,
} from "@/features/financial-records/utils/format-recurrence-rule-summary";
import { validateRecurrenceRule } from "@/features/financial-records/utils/generate-recurring-due-dates";

type ActivePicker = "endUntilDate" | "frequency" | "endType" | null;
type EndType = "count" | "until";

interface RecurrenceRuleSheetProps {
  isOpen: boolean;
  startDate: string;
  rule: RecurrenceRule | null;
  onSave: (rule: RecurrenceRule | null) => void;
  onClose: () => void;
}

const END_TYPE_OPTIONS: readonly EndType[] = ["count", "until"];
const END_TYPE_LABELS: Record<EndType, string> = {
  count: "Após X ocorrências",
  until: "Em uma data",
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildDraftRule(
  repeatEnabled: boolean,
  intervalInput: string,
  frequency: RecurrenceRule["frequency"],
  weekDays: number[],
  monthDayInput: string,
  endType: EndType,
  endCountInput: string,
  endUntilDate: string,
  startDate: string,
): RecurrenceRule | null {
  if (!repeatEnabled) {
    return null;
  }

  const interval = parsePositiveInt(intervalInput, 1);
  const monthDay = parsePositiveInt(monthDayInput, parsePositiveInt(startDate.split("-")[2] ?? "1", 1));

  return {
    interval,
    frequency,
    weekDays: frequency === "weekly" ? weekDays : undefined,
    monthDay: frequency === "monthly" ? monthDay : undefined,
    end:
      endType === "count"
        ? {
            type: "count",
            count: parsePositiveInt(endCountInput, MIN_RECURRENCE_OCCURRENCES),
          }
        : { type: "until", date: endUntilDate },
  };
}

export function RecurrenceRuleSheet({
  isOpen,
  startDate,
  rule,
  onSave,
  onClose,
}: RecurrenceRuleSheetProps) {
  const [repeatEnabled, setRepeatEnabled] = useState(Boolean(rule));
  const [intervalInput, setIntervalInput] = useState("1");
  const [frequency, setFrequency] = useState<RecurrenceRule["frequency"]>("monthly");
  const [weekDays, setWeekDays] = useState<number[]>([1]);
  const [monthDayInput, setMonthDayInput] = useState("1");
  const [endType, setEndType] = useState<EndType>("count");
  const [endCountInput, setEndCountInput] = useState("12");
  const [endUntilDate, setEndUntilDate] = useState(startDate);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialRule = rule ?? createDefaultRecurrenceRule(startDate);
    setRepeatEnabled(rule != null);
    setIntervalInput(String(initialRule.interval));
    setFrequency(initialRule.frequency);
    setWeekDays(
      initialRule.weekDays?.length
        ? initialRule.weekDays
        : [new Date(`${startDate}T12:00:00`).getDay()],
    );
    setMonthDayInput(
      String(initialRule.monthDay ?? Number.parseInt(startDate.split("-")[2] ?? "1", 10)),
    );
    setEndType(initialRule.end.type === "until" ? "until" : "count");
    setEndCountInput(
      initialRule.end.type === "count" ? String(initialRule.end.count) : "12",
    );
    setEndUntilDate(
      initialRule.end.type === "until" ? initialRule.end.date : startDate,
    );
    setActivePicker(null);
    setError(null);
  }, [isOpen, rule, startDate]);

  const draftRule = buildDraftRule(
    repeatEnabled,
    intervalInput,
    frequency,
    weekDays,
    monthDayInput,
    endType,
    endCountInput,
    endUntilDate,
    startDate,
  );

  const previewSummary =
    draftRule != null
      ? formatRecurrenceRuleSummary(draftRule, startDate)
      : "Não repetir";

  function toggleWeekday(day: number) {
    setWeekDays((current) => {
      if (current.includes(day)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((value) => value !== day);
      }
      return [...current, day].sort((left, right) => left - right);
    });
  }

  function handleSave() {
    if (!repeatEnabled) {
      onSave(null);
      onClose();
      return;
    }

    try {
      if (draftRule) {
        validateRecurrenceRule(draftRule);
      }
      onSave(draftRule);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Regra de recorrência inválida",
      );
    }
  }

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        titleId="recurrence-rule-title"
        zIndexClass="z-[60]"
        onClose={onClose}
      >
        <FormSheetPanel>
          <FormSheetHeader
            title="Recorrência"
            titleId="recurrence-rule-title"
            onCancel={onClose}
            onSave={handleSave}
            saveLabel="Aplicar"
          />

          <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
            {error ? (
              <p className="mb-3 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
                {error}
              </p>
            ) : null}

            <label className="flex items-center justify-between gap-3 border-b border-border/60 py-3">
              <span className="text-sm text-text-secondary">Repetir</span>
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(event) => setRepeatEnabled(event.target.checked)}
                className="accent-link h-4 w-4"
              />
            </label>

            {repeatEnabled ? (
              <div className="divide-y divide-border/60">
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="shrink-0 text-sm text-text-secondary">
                    Repetir a cada
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={intervalInput}
                      onChange={(event) =>
                        setIntervalInput(digitsOnly(event.target.value))
                      }
                      className="w-12 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm font-medium text-text-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setActivePicker("frequency")}
                      className="rounded-lg border border-border px-2 py-1 text-sm font-medium text-text-primary"
                    >
                      {RECURRENCE_FREQUENCY_UNIT_LABELS[frequency]}
                    </button>
                  </div>
                </div>

                {frequency === "weekly" ? (
                  <div className="py-3">
                    <p className="mb-2 text-sm text-text-secondary">
                      Dias da semana
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {RECURRENCE_WEEKDAY_OPTIONS.map((day) => {
                        const selected = weekDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWeekday(day)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              selected
                                ? "bg-link text-white"
                                : "border border-border bg-background text-text-secondary"
                            }`}
                          >
                            {RECURRENCE_WEEKDAY_LABELS[day]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {frequency === "monthly" ? (
                  <FormInputRow
                    label="Dia do mês"
                    value={monthDayInput}
                    placeholder="1–31"
                    onChange={(value) => setMonthDayInput(digitsOnly(value))}
                  />
                ) : null}

                <FormFieldRow
                  label="Termina"
                  value={END_TYPE_LABELS[endType]}
                  onClick={() => setActivePicker("endType")}
                />

                {endType === "count" ? (
                  <FormInputRow
                    label="Ocorrências"
                    value={endCountInput}
                    placeholder={`${MIN_RECURRENCE_OCCURRENCES}–${MAX_RECURRENCE_OCCURRENCES}`}
                    onChange={(value) => setEndCountInput(digitsOnly(value))}
                  />
                ) : (
                  <FormFieldRow
                    label="Data final"
                    value={formatIsoDatePtBr(endUntilDate)}
                    onClick={() => setActivePicker("endUntilDate")}
                  />
                )}
              </div>
            ) : null}

            <p className="mt-4 rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-text-secondary">
              {previewSummary}
            </p>
          </div>
        </FormSheetPanel>
      </SheetScaffold>

      <OptionPickerSheet
        isOpen={activePicker === "frequency"}
        title="Unidade"
        selected={frequency}
        options={RECURRENCE_FREQUENCY_OPTIONS}
        getLabel={(option) =>
          RECURRENCE_FREQUENCY_UNIT_LABELS[option as RecurrenceRule["frequency"]]
        }
        onSelect={(option) =>
          setFrequency(option as RecurrenceRule["frequency"])
        }
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "endType"}
        title="Termina"
        selected={endType}
        options={END_TYPE_OPTIONS}
        getLabel={(option) => END_TYPE_LABELS[option as EndType]}
        onSelect={(option) => setEndType(option as EndType)}
        onClose={() => setActivePicker(null)}
      />

      <DatePickerSheet
        isOpen={activePicker === "endUntilDate"}
        value={endUntilDate}
        onSave={setEndUntilDate}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
