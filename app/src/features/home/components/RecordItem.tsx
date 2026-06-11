import { useNavigate } from "react-router-dom";

import type { Category, FinancialRecord } from "@/features/home/types";
import {
  SWIPE_ACTION_WIDTH_PX,
  useRecordSwipeAction,
} from "@/features/home/hooks/useRecordSwipeAction";
import { canQuickSettleRecord } from "@/features/home/utils/can-quick-settle-record";
import { formatCurrency, isToday } from "@/features/home/utils";
import { CategoryIcon } from "./CategoryIcon";

const SWIPE_ACTION_LABEL = "Efetivar";
/** Fundo opaco base das linhas — igual dentro e fora do grupo Hoje. */
const RECORD_ROW_BG_CLASS = "bg-background";

function SwipeCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

interface RecordItemProps {
  record: FinancialRecord;
  category?: Category;
  referenceDate: string;
  swipeEnabled?: boolean;
  onQuickSettle?: (record: FinancialRecord) => Promise<void>;
}

export function RecordItem({
  record,
  category,
  referenceDate,
  swipeEnabled = false,
  onQuickSettle,
}: RecordItemProps) {
  const navigate = useNavigate();
  const isPayable = record.type === "payable";
  const amountColor = isPayable ? "text-expense" : "text-income";
  const amountPrefix = isPayable ? "-" : "+";
  const canSwipe =
    swipeEnabled && canQuickSettleRecord(record) && onQuickSettle != null;

  const {
    offsetX,
    isDragging,
    isSettling,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useRecordSwipeAction({
    enabled: canSwipe,
    onTap: () => navigate(`/records/${record.id}`),
    onCommit: () => onQuickSettle!(record),
  });

  const content = (
    <>
      {category ? (
        <CategoryIcon
          category={category}
          hasDocument={record.hasDocument}
          hasReceipt={record.hasReceipt}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {record.title}
        </p>
        <p className="truncate text-xs text-text-secondary">
          {category?.name ?? "Sem categoria"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${amountColor}`}>
          {amountPrefix}
          {formatCurrency(record.amount)}
        </p>
        <StatusBadge record={record} referenceDate={referenceDate} />
      </div>
    </>
  );

  const rowHoverClass =
    "transition-colors hover:bg-surface-soft/60 active:bg-surface-soft";

  if (!canSwipe) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/records/${record.id}`)}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${RECORD_ROW_BG_CLASS} ${rowHoverClass}`}
      >
        {content}
      </button>
    );
  }

  const revealSwipeAction = offsetX > 0 || isDragging || isSettling;

  return (
    <div className={`relative overflow-hidden ${RECORD_ROW_BG_CLASS}`}>
      <div
        className={`absolute inset-y-0 left-0 z-0 flex flex-col items-center justify-center gap-1 bg-action-gradient text-background transition-opacity duration-150 ${
          revealSwipeAction
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ width: SWIPE_ACTION_WIDTH_PX }}
        aria-hidden={!revealSwipeAction}
      >
        {isSettling ? (
          <span className="text-sm font-semibold">…</span>
        ) : (
          <>
            <SwipeCheckIcon className="h-5 w-5 shrink-0 text-background" />
            <span className="text-xs font-semibold text-background">
              {SWIPE_ACTION_LABEL}
            </span>
          </>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`${record.title}. Deslize para efetivar`}
        className={`relative z-10 flex w-full touch-pan-y items-center gap-3 px-4 py-2.5 text-left select-none ${RECORD_ROW_BG_CLASS} ${rowHoverClass} ${
          isDragging || isSettling
            ? ""
            : "transition-[transform,background-color] duration-200 ease-out"
        }`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(`/records/${record.id}`);
          }
        }}
      >
        {content}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  record: FinancialRecord;
  referenceDate: string;
}

function getPendingLabelColor(
  record: FinancialRecord,
  referenceDate: string,
): string {
  if (record.date < referenceDate) {
    return "text-expense";
  }

  if (isToday(record.date, referenceDate)) {
    return "text-warning";
  }

  return "text-text-secondary";
}

function StatusBadge({ record, referenceDate }: StatusBadgeProps) {
  if (record.status === "completed" || record.status === "canceled") {
    return null;
  }

  return (
    <span
      className={`text-[10px] uppercase tracking-wide ${getPendingLabelColor(record, referenceDate)}`}
    >
      Pendente
    </span>
  );
}
