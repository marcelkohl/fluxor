import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ThemeIcon } from "@/config/theme";
import { WalletFormSheet } from "@/features/wallets/components/WalletFormSheet";
import { WalletListItem } from "@/features/wallets/components/WalletListItem";
import { WalletSearchField } from "@/features/wallets/components/WalletSearchField";
import { useWallets } from "@/features/wallets/hooks/useWallets";
import type { Wallet } from "@/features/wallets/domain";

type WalletSheetState =
  | { mode: "create" }
  | { mode: "edit"; wallet: Wallet };

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function WalletsPage() {
  const navigate = useNavigate();
  const { wallets, isLoading, error, reload } = useWallets();
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<WalletSheetState | null>(null);

  const filteredWallets = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) {
      return wallets;
    }

    return wallets.filter((wallet) => {
      const haystack = [wallet.name, wallet.notes ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, wallets]);

  function openCreate() {
    setSheet({ mode: "create" });
  }

  function openEdit(wallet: Wallet) {
    setSheet({ mode: "edit", wallet });
  }

  function closeSheet() {
    setSheet(null);
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate("/settings")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-text-primary">
          Carteiras
        </h1>

        <button
          type="button"
          aria-label="Adicionar carteira"
          onClick={openCreate}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-link transition-colors hover:bg-link-soft"
        >
          <ThemeIcon name="add" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <WalletSearchField value={search} onChange={setSearch} />

        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando carteiras...
          </p>
        ) : error ? (
          <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {error}
          </p>
        ) : filteredWallets.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              {search.trim()
                ? "Nenhuma carteira encontrada"
                : "Nenhuma carteira cadastrada"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {search.trim()
                ? "Tente outro termo de busca."
                : "Toque em + para adicionar a primeira carteira."}
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/50">
            {filteredWallets.map((wallet) => (
              <WalletListItem
                key={wallet.id}
                wallet={wallet}
                onClick={() => openEdit(wallet)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && wallets.length > 0 ? (
          <p className="mt-6 text-center text-xs text-text-secondary">
            {filteredWallets.length}{" "}
            {filteredWallets.length === 1
              ? "carteira encontrada"
              : "carteiras encontradas"}
          </p>
        ) : null}
      </div>

      <WalletFormSheet
        isOpen={sheet !== null}
        mode={sheet?.mode ?? "create"}
        wallet={sheet?.mode === "edit" ? sheet.wallet : null}
        isFirstWallet={wallets.length === 0}
        onClose={closeSheet}
        onSaved={reload}
      />
    </div>
  );
}
