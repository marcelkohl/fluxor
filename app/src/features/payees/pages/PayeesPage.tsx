import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AdminSearchField } from "@/components/admin-form";
import { ThemeIcon } from "@/config/theme";
import { PayeeFormSheet } from "@/features/payees/components/PayeeFormSheet";
import { PayeeListItem } from "@/features/payees/components/PayeeListItem";
import { usePayees } from "@/features/payees/hooks/usePayees";
import type { Payee } from "@/features/payees/domain";

type PayeeSheetState = { mode: "create" } | { mode: "edit"; payee: Payee };

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function PayeesPage() {
  const navigate = useNavigate();
  const { payees, isLoading, error, reload } = usePayees();
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<PayeeSheetState | null>(null);

  const filteredPayees = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) {
      return payees;
    }

    return payees.filter((payee) => {
      const haystack = [payee.name, payee.notes ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [search, payees]);

  function openCreate() {
    setSheet({ mode: "create" });
  }

  function openEdit(payee: Payee) {
    setSheet({ mode: "edit", payee });
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
          Favorecidos
        </h1>

        <button
          type="button"
          aria-label="Adicionar favorecido"
          onClick={openCreate}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-link transition-colors hover:bg-link-soft"
        >
          <ThemeIcon name="add" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AdminSearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar favorecidos..."
          ariaLabel="Buscar favorecidos"
        />

        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando favorecidos...
          </p>
        ) : error ? (
          <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {error}
          </p>
        ) : filteredPayees.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              {search.trim()
                ? "Nenhum favorecido encontrado"
                : "Nenhum favorecido cadastrado"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {search.trim()
                ? "Tente outro termo de busca."
                : "Toque em + para adicionar o primeiro favorecido."}
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/50">
            {filteredPayees.map((payee) => (
              <PayeeListItem
                key={payee.id}
                payee={payee}
                onClick={() => openEdit(payee)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && payees.length > 0 ? (
          <p className="mt-6 text-center text-xs text-text-secondary">
            {filteredPayees.length}{" "}
            {filteredPayees.length === 1
              ? "favorecido encontrado"
              : "favorecidos encontrados"}
          </p>
        ) : null}
      </div>

      <PayeeFormSheet
        isOpen={sheet !== null}
        mode={sheet?.mode ?? "create"}
        payee={sheet?.mode === "edit" ? sheet.payee : null}
        onClose={closeSheet}
        onSaved={reload}
      />
    </div>
  );
}
