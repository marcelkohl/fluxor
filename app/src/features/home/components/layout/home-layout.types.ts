import type {
  AccountWallet,
  Category,
  FinancialRecord,
  HomeContextState,
  RecordDayGroup,
} from "@/features/home/types";
import type { HomeWidgetContext } from "@/features/widgets/types";

export interface HomeLayoutProps {
  account: AccountWallet;
  hasWallets: boolean;
  isWalletsLoading: boolean;
  context: HomeContextState;
  groupedRecords: RecordDayGroup[];
  categoriesById: Record<string, Category>;
  widgetContext: HomeWidgetContext;
  activeFilterCount: number;
  recordsError: string | null;
  isRecordsLoading: boolean;
  isBrowserFallback: boolean;
  highlightedDate: string | null;
  onOpenWalletPicker: () => void;
  onAddRecord: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenExport: () => void;
  onOpenFilters: () => void;
  onActiveWidgetChange: (widgetId: string) => void;
  onQuickSettle: (record: FinancialRecord) => Promise<void>;
}
