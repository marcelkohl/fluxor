import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import type { Wallet } from "@/features/wallets/domain";

import { WalletAvatar } from "./WalletAvatar";

interface WalletListItemProps {
  wallet: Wallet;
  onClick: () => void;
}

export function WalletListItem({ wallet, onClick }: WalletListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-surface-soft active:bg-surface-soft"
    >
      <WalletAvatar
        icon={wallet.icon as ThemeIconName}
        color={wallet.color}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-text-primary">
            {wallet.name}
          </span>
          {wallet.isDefault ? (
            <span className="shrink-0 rounded bg-link-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-link">
              Padrão
            </span>
          ) : null}
        </span>
        {wallet.notes ? (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">
            {wallet.notes}
          </span>
        ) : (
          <span className="mt-0.5 block text-xs text-muted">
            Sem observações
          </span>
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
