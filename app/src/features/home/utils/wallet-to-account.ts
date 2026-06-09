import type { Wallet } from "@/features/wallets/domain";
import {
  DEFAULT_WALLET_COLOR,
  DEFAULT_WALLET_ICON,
} from "@/features/wallets/config/wallet-options";
import type { ThemeIconName } from "@/config/theme";

import type { AccountWallet } from "../types";

export function walletToAccountWallet(wallet: Wallet): AccountWallet {
  return {
    id: wallet.id,
    name: wallet.name,
    icon: wallet.icon as ThemeIconName,
    color: wallet.color,
  };
}

export const EMPTY_WALLET_PLACEHOLDER: AccountWallet = {
  id: "",
  name: "Nenhuma carteira",
  icon: DEFAULT_WALLET_ICON,
  color: DEFAULT_WALLET_COLOR,
};
