import { useEffect, useMemo } from "react";

import { useActiveAccountId } from "@/features/home/hooks/useActiveAccountId";
import { homeStateService } from "@/features/home/state";
import type { AccountWallet } from "@/features/home/types";
import { logRemoteDev } from "@/features/home/utils/dev-log";
import {
  isValidEntityId,
  shouldUseHomeMocks,
} from "@/features/home/utils/home-persistence";
import {
  EMPTY_WALLET_PLACEHOLDER,
  walletToAccountWallet,
} from "@/features/home/utils/wallet-to-account";
import {
  DEFAULT_WALLET_COLOR,
  DEFAULT_WALLET_ICON,
} from "@/features/wallets/config/wallet-options";
import { useWallets } from "@/features/wallets/hooks/useWallets";

export interface UseHomeWalletsResult {
  accounts: AccountWallet[];
  activeAccount: AccountWallet;
  isLoading: boolean;
  hasWallets: boolean;
  /** @deprecated Preferir `usesMockData` — mantido para layouts existentes. */
  isBrowserFallback: boolean;
  usesMockData: boolean;
}

export function useHomeWallets(): UseHomeWalletsResult {
  const { wallets, isLoading } = useWallets();
  const usesMockData = shouldUseHomeMocks();
  const activeAccountId = useActiveAccountId();

  const accounts = useMemo((): AccountWallet[] => {
    if (usesMockData) {
      return [];
    }
    return wallets.map(walletToAccountWallet);
  }, [usesMockData, wallets]);

  useEffect(() => {
    if (usesMockData || isLoading || wallets.length === 0) {
      return;
    }

    const trimmedId = activeAccountId.trim();

    if (!trimmedId) {
      const defaultWallet = wallets.find((wallet) => wallet.isDefault);
      const initial = defaultWallet ?? wallets[0];
      if (initial) {
        if (import.meta.env.DEV) {
          logRemoteDev("useHomeWallets auto-init (empty activeAccountId)", {
            walletId: initial.id,
          });
        }
        homeStateService.setActiveAccount(initial.id);
      }
      return;
    }

    if (!isValidEntityId(trimmedId)) {
      const fallback = wallets.find((wallet) => wallet.isDefault) ?? wallets[0];
      if (fallback) {
        if (import.meta.env.DEV) {
          logRemoteDev("useHomeWallets auto-init (invalid activeAccountId)", {
            previousId: trimmedId,
            walletId: fallback.id,
          });
        }
        homeStateService.setActiveAccount(fallback.id);
      }
      return;
    }

    const currentExists = wallets.some((wallet) => wallet.id === trimmedId);
    if (!currentExists) {
      const fallback = wallets.find((wallet) => wallet.isDefault) ?? wallets[0];
      if (fallback) {
        if (import.meta.env.DEV) {
          logRemoteDev("useHomeWallets auto-init (wallet not in list)", {
            previousId: trimmedId,
            walletId: fallback.id,
          });
        }
        homeStateService.setActiveAccount(fallback.id);
      }
    }
  }, [activeAccountId, isLoading, usesMockData, wallets]);

  const activeAccount = useMemo((): AccountWallet => {
    if (isLoading && !usesMockData) {
      return {
        id: activeAccountId,
        name: "Carregando…",
        icon: DEFAULT_WALLET_ICON,
        color: DEFAULT_WALLET_COLOR,
      };
    }

    if (accounts.length === 0) {
      return EMPTY_WALLET_PLACEHOLDER;
    }

    const selected = accounts.find((account) => account.id === activeAccountId);
    if (selected) {
      return selected;
    }

    return EMPTY_WALLET_PLACEHOLDER;
  }, [accounts, activeAccountId, isLoading, usesMockData]);

  return {
    accounts,
    activeAccount,
    isLoading: isLoading && !usesMockData,
    hasWallets: accounts.length > 0,
    isBrowserFallback: usesMockData,
    usesMockData,
  };
}
