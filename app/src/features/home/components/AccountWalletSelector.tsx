import type { AccountWallet } from "@/features/home/types";
import { ThemeIcon } from "@/config/theme";
import { WalletAvatar } from "@/features/wallets/components/WalletAvatar";

interface AccountWalletSelectorProps {
  activeAccount: AccountWallet;
  disabled?: boolean;
  onOpen: () => void;
}

export function AccountWalletSelector({
  activeAccount,
  disabled = false,
  onOpen,
}: AccountWalletSelectorProps) {
  return (
    <button
      type="button"
      aria-label="Selecionar carteira"
      aria-haspopup="listbox"
      aria-expanded={false}
      disabled={disabled}
      onClick={onOpen}
      className="flex min-w-0 max-w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface-soft disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
    >
      <WalletAvatar
        icon={activeAccount.icon}
        color={activeAccount.color}
        size="sm"
      />

      <span className="min-w-0 truncate text-base font-semibold text-text-primary">
        {activeAccount.name}
      </span>

      <ThemeIcon
        name="chevronDown"
        size="sm"
        className="shrink-0 text-text-secondary"
      />
    </button>
  );
}
