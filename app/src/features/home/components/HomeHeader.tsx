import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AccountWallet } from "@/features/home/types";
import { ThemeIcon } from "@/config/theme";
import { AccountWalletSelector } from "./AccountWalletSelector";

interface HomeHeaderProps {
  account: AccountWallet;
  walletSelectorDisabled?: boolean;
  onOpenWalletPicker: () => void;
  onAddRecord: () => void;
}

export function HomeHeader({
  account,
  walletSelectorDisabled = false,
  onOpenWalletPicker,
  onAddRecord,
}: HomeHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="z-10 border-b border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <AccountWalletSelector
            activeAccount={account}
            disabled={walletSelectorDisabled}
            onOpen={onOpenWalletPicker}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Notificações">
            <ThemeIcon name="notification" />
          </IconButton>
          <IconButton
            label="Configurações"
            onClick={() => navigate("/settings")}
          >
            <ThemeIcon name="settings" />
          </IconButton>
          <button
            type="button"
            aria-label="Adicionar registro"
            onClick={onAddRecord}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-action-gradient text-background transition-opacity hover:opacity-90"
          >
            <ThemeIcon name="add" />
          </button>
        </div>
      </div>
    </header>
  );
}

interface IconButtonProps {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}

function IconButton({ label, children, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
    >
      {children}
    </button>
  );
}
