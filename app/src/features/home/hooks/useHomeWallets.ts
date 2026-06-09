import { useEffect, useMemo, useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

import { mockActiveAccount } from "@/features/home/mocks/accounts.mock";
import { homeStateService } from "@/features/home/state";
import type { AccountWallet } from "@/features/home/types";
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
  isBrowserFallback: boolean;
}

export function useHomeWallets(): UseHomeWalletsResult {
  const { wallets, isLoading } = useWallets();
  const isBrowserFallback = !isTauri();

  const activeAccountId = useSyncExternalStore(
    (listener) => homeStateService.subscribe(listener),
    () => homeStateService.getState().activeAccountId,
    () => homeStateService.getState().activeAccountId,
  );

  const accounts = useMemo((): AccountWallet[] => {
    if (isBrowserFallback) {
      return [mockActiveAccount];
    }
    return wallets.map(walletToAccountWallet);
  }, [isBrowserFallback, wallets]);

  useEffect(() => {
    if (isBrowserFallback || isLoading || accounts.length === 0) {
      return;
    }

    const currentExists = accounts.some(
      (account) => account.id === activeAccountId,
    );

    if (!currentExists) {
      const defaultWallet = wallets.find((wallet) => wallet.isDefault);
      const initial = defaultWallet ?? wallets[0];
      if (initial) {
        homeStateService.setActiveAccount(initial.id);
      }
    }
  }, [
    accounts,
    activeAccountId,
    isBrowserFallback,
    isLoading,
    wallets,
  ]);

  const activeAccount = useMemo((): AccountWallet => {
    if (isLoading && !isBrowserFallback) {
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

    return (
      accounts.find((account) => account.id === activeAccountId) ??
      accounts[0] ??
      EMPTY_WALLET_PLACEHOLDER
    );
  }, [accounts, activeAccountId, isBrowserFallback, isLoading]);

  return {
    accounts,
    activeAccount,
    isLoading: isLoading && !isBrowserFallback,
    hasWallets: accounts.length > 0,
    isBrowserFallback,
  };
}
