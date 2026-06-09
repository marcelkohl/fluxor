import type { CalendarDaySummary } from "./financial-calendar.types";
import { calculateFinancialCalendar } from "./financial-calendar.calculations";
import type { WidgetProps } from "@/features/widgets/types";

export function FinancialCalendarWidget({ context }: WidgetProps) {
  const calendar = calculateFinancialCalendar(
    context.records,
    context.selectedMonth,
    context.selectedYear,
  );

  const datesWithRecords = new Set(
    context.records.map((record) => record.date),
  );

  const days = calendar.weeks.flat();

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-3">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
        Calendário Financeiro
      </h2>

      <div className="grid shrink-0 grid-cols-7 gap-0.5 text-center text-[8px] font-medium leading-none text-text-secondary">
        {calendar.weekdayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7 gap-0.5"
        style={{
          gridTemplateRows: `repeat(${calendar.weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {days.map((day, index) => (
          <CalendarDayCell
            key={day?.date ?? `empty-${index}`}
            day={day}
            hasRecords={day ? datesWithRecords.has(day.date) : false}
            onNavigate={context.navigateToDate}
          />
        ))}
      </div>
    </div>
  );
}

interface CalendarDayCellProps {
  day: CalendarDaySummary | null;
  hasRecords: boolean;
  onNavigate: (date: string) => void;
}

function CalendarDayCell({ day, hasRecords, onNavigate }: CalendarDayCellProps) {
  if (!day) {
    return <div aria-hidden="true" className="min-h-0 min-w-0" />;
  }

  const cellClassName = `flex aspect-square h-full w-auto max-w-full flex-col rounded border p-0.5 text-center ${
    day.isToday
      ? "border-link/50 bg-link-soft"
      : "border-border/40"
  } ${hasRecords ? "cursor-pointer active:opacity-80" : ""}`;

  const content = (
    <>
      <p
        className={`text-[9px] font-semibold leading-none ${
          day.isToday ? "text-link" : "text-text-primary"
        }`}
      >
        {day.day}
      </p>

      {day.receivableCents > 0 ? (
        <p className="mt-0.5 text-[7px] leading-none text-income">
          +{day.receivableCents}
        </p>
      ) : null}

      {day.payableCents > 0 ? (
        <p className="mt-0.5 text-[7px] leading-none text-expense">
          -{day.payableCents}
        </p>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-0 min-w-0 items-center justify-center">
      {!hasRecords ? (
        <div
          aria-label={day.isToday ? `Dia ${day.day}, hoje` : `Dia ${day.day}`}
          aria-current={day.isToday ? "date" : undefined}
          className={cellClassName}
        >
          {content}
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Ver registros do dia ${day.day}`}
          aria-current={day.isToday ? "date" : undefined}
          className={cellClassName}
          onClick={() => onNavigate(day.date)}
        >
          {content}
        </button>
      )}
    </div>
  );
}
