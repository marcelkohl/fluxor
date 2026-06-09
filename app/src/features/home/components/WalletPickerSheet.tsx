import { OptionPickerSheet } from "@/components/admin-form";
import type { AccountWallet } from "@/features/home/types";
import { WalletAvatar } from "@/features/wallets/components/WalletAvatar";

interface WalletPickerSheetProps {
  isOpen: boolean;
  accounts: AccountWallet[];
  selectedAccountId: string;
  onSelect: (accountId: string) => void;
  onClose: () => void;
}

export function WalletPickerSheet({
  isOpen,
  accounts,
  selectedAccountId,
  onSelect,
  onClose,
}: WalletPickerSheetProps) {
  const accountById = Object.fromEntries(
    accounts.map((account) => [account.id, account]),
  );

  return (
    <OptionPickerSheet
      isOpen={isOpen}
      title="Carteira"
      selected={selectedAccountId}
      options={accounts.map((account) => account.id)}
      getLabel={(accountId) => accountById[accountId]?.name ?? accountId}
      renderOption={(accountId) => {
        const account = accountById[accountId];
        if (!account) {
          return (
            <span className="text-sm font-medium text-text-primary">
              {accountId}
            </span>
          );
        }

        return (
          <>
            <WalletAvatar
              icon={account.icon}
              color={account.color}
              size="sm"
            />
            <span className="min-w-0 truncate text-sm font-medium text-text-primary">
              {account.name}
            </span>
          </>
        );
      }}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
