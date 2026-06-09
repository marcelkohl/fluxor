import type { Category, FinancialRecord, RecordDayGroup } from "@/features/home/types";
import { RecordGroup } from "./RecordGroup";

interface RecordListProps {
  groups: RecordDayGroup[];
  referenceDate: string;
  categoriesById: Record<string, Category>;
  highlightedDate?: string | null;
  swipeEnabled?: boolean;
  onQuickSettle?: (record: FinancialRecord) => Promise<void>;
}

export function RecordList({
  groups,
  referenceDate,
  categoriesById,
  highlightedDate = null,
  swipeEnabled,
  onQuickSettle,
}: RecordListProps) {
  if (groups.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-text-secondary">
        Nenhum registro neste mês.
      </p>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-6">
      {groups.map((group) => (
        <RecordGroup
          key={group.date}
          group={group}
          referenceDate={referenceDate}
          categoriesById={categoriesById}
          highlighted={highlightedDate === group.date}
          swipeEnabled={swipeEnabled}
          onQuickSettle={onQuickSettle}
        />
      ))}
    </div>
  );
}
