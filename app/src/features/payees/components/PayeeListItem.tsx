import { defaultEntityColor, ThemeIcon } from "@/config/theme";
import { ThemeEntityAvatar } from "@/components/admin-form";
import type { Payee } from "@/features/payees/domain";

interface PayeeListItemProps {
  payee: Payee;
  onClick: () => void;
}

export function PayeeListItem({ payee, onClick }: PayeeListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-surface-soft active:bg-surface-soft"
    >
      <ThemeEntityAvatar
        icon="users"
        color={defaultEntityColor}
        size="md"
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">
          {payee.name}
        </span>
        {payee.notes ? (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">
            {payee.notes}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted">Sem observação</span>
        )}
      </span>

      <ThemeIcon
        name="chevronRight"
        size="sm"
        className="shrink-0 text-text-secondary"
      />
    </button>
  );
}
