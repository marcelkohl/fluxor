import { useEffect, useMemo, useState } from "react";

import { ThemeIcon } from "@/config/theme";

import { FormSheetPanel } from "./FormSheetPanel";
import { SheetScaffold } from "./SheetScaffold";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;
const CALENDAR_ROWS = 6;
const CALENDAR_COLS = 7;
const CALENDAR_CELL_COUNT = CALENDAR_ROWS * CALENDAR_COLS;

export interface DatePickerSheetProps {
  isOpen: boolean;
  value: string;
  title?: string;
  onSave: (isoDate: string) => void;
  onClose: () => void;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseIsoDate(iso: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(year, month - 1, day);

  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toIsoDate(parts: DateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function shiftMonth(year: number, month: number, delta: number): DateParts {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: 1,
  };
}

export function formatIsoDatePtBr(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) {
    return iso;
  }

  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return `${day}/${month}/${parts.year}`;
}

function formatMonthYearLabel(year: number, month: number): string {
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
}

function todayParts(): DateParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function DatePickerSheet({
  isOpen,
  value,
  onSave,
  onClose,
}: DatePickerSheetProps) {
  const selectedParts = parseIsoDate(value);
  const initialView = selectedParts ?? todayParts();

  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const next = parseIsoDate(value) ?? todayParts();
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [isOpen, value]);

  const monthLabel = formatMonthYearLabel(viewYear, viewMonth);

  const calendarCells = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const cells: Array<{ day: number | null; key: string }> = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({ day: null, key: `empty-start-${index}` });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({ day, key: `day-${day}` });
    }

    while (cells.length < CALENDAR_CELL_COUNT) {
      cells.push({ day: null, key: `empty-end-${cells.length}` });
    }

    return cells;
  }, [viewMonth, viewYear]);

  function handlePreviousMonth() {
    const shifted = shiftMonth(viewYear, viewMonth, -1);
    setViewYear(shifted.year);
    setViewMonth(shifted.month);
  }

  function handleNextMonth() {
    const shifted = shiftMonth(viewYear, viewMonth, 1);
    setViewYear(shifted.year);
    setViewMonth(shifted.month);
  }

  function commitDate(parts: DateParts) {
    onSave(toIsoDate(parts));
    onClose();
  }

  function handleSelectDay(day: number) {
    commitDate({ year: viewYear, month: viewMonth, day });
  }

  function handleToday() {
    const today = todayParts();
    setViewYear(today.year);
    setViewMonth(today.month);
    commitDate(today);
  }

  return (
    <SheetScaffold
      isOpen={isOpen}
      titleId="date-picker-title"
      zIndexClass="z-[60]"
      onClose={onClose}
    >
      <div className="w-full overflow-hidden">
        <FormSheetPanel>
          <header className="flex items-center gap-1 border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              className="w-14 shrink-0 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancelar
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={handlePreviousMonth}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
              >
                <ThemeIcon name="chevronLeft" size="sm" />
              </button>

              <span
                id="date-picker-title"
                className="min-w-0 truncate px-0.5 text-center text-sm font-semibold text-text-primary"
              >
                {monthLabel}
              </span>

              <button
                type="button"
                aria-label="Próximo mês"
                onClick={handleNextMonth}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
              >
                <ThemeIcon name="chevronRight" size="sm" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="w-14 shrink-0 text-right text-sm font-medium text-link transition-opacity hover:opacity-80"
            >
              Hoje
            </button>
          </header>

          <div className="overflow-hidden px-3 py-2">
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="flex h-5 items-center justify-center text-center text-[11px] font-medium text-text-secondary"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-6 gap-0.5">
              {calendarCells.map((cell) => {
                if (cell.day == null) {
                  return <span key={cell.key} aria-hidden className="h-9" />;
                }

                const isSelected =
                  selectedParts != null &&
                  selectedParts.year === viewYear &&
                  selectedParts.month === viewMonth &&
                  selectedParts.day === cell.day;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    aria-label={`Dia ${cell.day}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectDay(cell.day!)}
                    className={`flex h-9 w-full items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-background"
                        : "text-text-primary hover:bg-surface-soft"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
        </FormSheetPanel>
      </div>
    </SheetScaffold>
  );
}
