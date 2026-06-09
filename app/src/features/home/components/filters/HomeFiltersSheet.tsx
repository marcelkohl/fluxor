import { useEffect, useMemo, useState } from "react";

import {
  DatePickerSheet,
  OptionPickerSheet,
  ThemeEntityAvatar,
} from "@/components/admin-form";
import type { ThemeIconName } from "@/config/theme";
import type { Category, FinancialRecord, Payee } from "@/features/home/types";
import {
  createEmptyHomeFiltersState,
  type HomeFiltersState,
} from "@/features/home/state";
import {
  applyHomeFilters,
  countActiveFilters,
  getFilterRowsDisplay,
  todayIsoDate,
} from "@/features/home/utils";
import {
  FILTER_ALL_CATEGORY,
  FILTER_ALL_PAYEE,
  FILTER_DOCUMENT_LABELS,
  FILTER_DOCUMENT_OPTIONS,
  FILTER_RECEIPT_LABELS,
  FILTER_RECEIPT_OPTIONS,
  FILTER_RECURRING_LABELS,
  FILTER_RECURRING_OPTIONS,
  FILTER_STATUS_LABELS,
  FILTER_STATUS_OPTIONS,
  FILTER_TYPE_LABELS,
  FILTER_TYPE_OPTIONS,
} from "@/features/home/utils/home-filter-options";
import { FilterFooter } from "./FilterFooter";
import { FilterHeader } from "./FilterHeader";
import { FilterMoneySheet } from "./FilterMoneySheet";
import { FilterRow } from "./FilterRow";

type ActiveFilterPicker =
  | "startDate"
  | "endDate"
  | "type"
  | "status"
  | "category"
  | "payee"
  | "minValue"
  | "maxValue"
  | "document"
  | "receipt"
  | "recurring"
  | null;

interface HomeFiltersSheetProps {
  isOpen: boolean;
  filters: HomeFiltersState;
  categoriesById: Record<string, Category>;
  payeesById: Record<string, Payee>;
  previewRecords: FinancialRecord[];
  onClose: () => void;
  onApply: (filters: HomeFiltersState) => void;
  onClear: () => void;
}

export function HomeFiltersSheet({
  isOpen,
  filters,
  categoriesById,
  payeesById,
  previewRecords,
  onClose,
  onApply,
  onClear,
}: HomeFiltersSheetProps) {
  const [draft, setDraft] = useState<HomeFiltersState>(filters);
  const [activePicker, setActivePicker] = useState<ActiveFilterPicker>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      setActivePicker(null);
    }
  }, [filters, isOpen]);

  const categories = useMemo(
    () =>
      Object.values(categoriesById).sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
    [categoriesById],
  );

  const payees = useMemo(
    () =>
      Object.values(payeesById).sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
    [payeesById],
  );

  const activeFilterCount = countActiveFilters(draft);
  const previewCount = useMemo(
    () => applyHomeFilters(previewRecords, draft).length,
    [draft, previewRecords],
  );

  const filterRows = getFilterRowsDisplay(draft, {
    categoriesById,
    payeesById,
  });

  const filterFieldKeys: ActiveFilterPicker[] = [
    "startDate",
    "endDate",
    "type",
    "status",
    "category",
    "payee",
    "minValue",
    "maxValue",
    "document",
    "receipt",
    "recurring",
  ];

  if (!isOpen) {
    return null;
  }

  function updateDraft(partial: Partial<HomeFiltersState>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function handleRowClick(index: number) {
    setActivePicker(filterFieldKeys[index] ?? null);
  }

  function handleApply() {
    onApply(draft);
  }

  function handleClear() {
    setDraft(createEmptyHomeFiltersState());
    onClear();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-filters-title"
      >
        <button
          type="button"
          aria-label="Fechar filtros"
          className="absolute inset-0 bg-background/80"
          onClick={onClose}
        />

        <div className="relative mx-auto w-full max-w-md">
          <div className="flex max-h-[85vh] flex-col rounded-t-xl border-t border-border bg-surface shadow-lg">
            <FilterHeader onClose={onClose} onClear={handleClear} />

            <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-surface-soft px-4 py-2.5">
              <div className="text-xs text-text-secondary">
                <span className="font-medium text-text-primary">
                  {activeFilterCount}
                </span>{" "}
                {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
              </div>
              <div className="text-xs text-text-secondary">
                <span className="font-medium text-text-primary">
                  {previewCount}
                </span>{" "}
                {previewCount === 1
                  ? "registro encontrado"
                  : "registros encontrados"}
              </div>
            </div>

            <div className="overflow-y-auto">
              {filterRows.map((row, index) => {
                const field = filterFieldKeys[index];
                const canClear =
                  field === "startDate"
                    ? Boolean(draft.startDate)
                    : field === "endDate"
                      ? Boolean(draft.endDate)
                      : field === "minValue"
                        ? draft.minValue !== null
                        : field === "maxValue"
                          ? draft.maxValue !== null
                          : false;

                return (
                  <FilterRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    onClick={() => handleRowClick(index)}
                    onClear={
                      canClear
                        ? () => {
                            if (field === "startDate") {
                              updateDraft({ startDate: null });
                            } else if (field === "endDate") {
                              updateDraft({ endDate: null });
                            } else if (field === "minValue") {
                              updateDraft({ minValue: null });
                            } else if (field === "maxValue") {
                              updateDraft({ maxValue: null });
                            }
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>

            <FilterFooter onApply={handleApply} onClear={handleClear} />
          </div>
        </div>
      </div>

      <DatePickerSheet
        isOpen={activePicker === "startDate"}
        value={draft.startDate ?? todayIsoDate()}
        onSave={(isoDate) => {
          updateDraft({ startDate: isoDate });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <DatePickerSheet
        isOpen={activePicker === "endDate"}
        value={draft.endDate ?? todayIsoDate()}
        onSave={(isoDate) => {
          updateDraft({ endDate: isoDate });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "type"}
        title="Tipo"
        selected={draft.type}
        options={FILTER_TYPE_OPTIONS}
        getLabel={(option) =>
          FILTER_TYPE_LABELS[option as HomeFiltersState["type"]]
        }
        onSelect={(option) => {
          updateDraft({ type: option as HomeFiltersState["type"] });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "status"}
        title="Status"
        selected={draft.status}
        options={FILTER_STATUS_OPTIONS}
        getLabel={(option) =>
          FILTER_STATUS_LABELS[option as HomeFiltersState["status"]]
        }
        onSelect={(option) => {
          updateDraft({ status: option as HomeFiltersState["status"] });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "category"}
        title="Categoria"
        selected={draft.categoryId ?? FILTER_ALL_CATEGORY}
        options={[FILTER_ALL_CATEGORY, ...categories.map((category) => category.id)]}
        getLabel={(id) =>
          id === FILTER_ALL_CATEGORY
            ? "Todas"
            : (categoriesById[id]?.name ?? id)
        }
        renderOption={(id) => {
          if (id === FILTER_ALL_CATEGORY) {
            return (
              <span className="text-sm font-medium text-text-primary">
                Todas
              </span>
            );
          }

          const category = categoriesById[id];
          if (!category) {
            return (
              <span className="text-sm font-medium text-text-primary">{id}</span>
            );
          }

          return (
            <>
              <ThemeEntityAvatar
                icon={category.icon as ThemeIconName}
                color={category.color}
                size="sm"
              />
              <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                {category.name}
              </span>
            </>
          );
        }}
        onSelect={(id) => {
          updateDraft({
            categoryId: id === FILTER_ALL_CATEGORY ? null : id,
          });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "payee"}
        title="Favorecido"
        selected={draft.payeeId ?? FILTER_ALL_PAYEE}
        options={[FILTER_ALL_PAYEE, ...payees.map((payee) => payee.id)]}
        getLabel={(id) =>
          id === FILTER_ALL_PAYEE ? "Todos" : (payeesById[id]?.name ?? id)
        }
        onSelect={(id) => {
          updateDraft({
            payeeId: id === FILTER_ALL_PAYEE ? null : id,
          });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <FilterMoneySheet
        isOpen={activePicker === "minValue"}
        title="Valor mínimo"
        valueCents={draft.minValue}
        onSave={(valueCents) => updateDraft({ minValue: valueCents })}
        onClose={() => setActivePicker(null)}
      />

      <FilterMoneySheet
        isOpen={activePicker === "maxValue"}
        title="Valor máximo"
        valueCents={draft.maxValue}
        onSave={(valueCents) => updateDraft({ maxValue: valueCents })}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "document"}
        title="Documento"
        selected={draft.documentState}
        options={FILTER_DOCUMENT_OPTIONS}
        getLabel={(option) =>
          FILTER_DOCUMENT_LABELS[option as HomeFiltersState["documentState"]]
        }
        onSelect={(option) => {
          updateDraft({
            documentState: option as HomeFiltersState["documentState"],
          });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "receipt"}
        title="Comprovante"
        selected={draft.receiptState}
        options={FILTER_RECEIPT_OPTIONS}
        getLabel={(option) =>
          FILTER_RECEIPT_LABELS[option as HomeFiltersState["receiptState"]]
        }
        onSelect={(option) => {
          updateDraft({
            receiptState: option as HomeFiltersState["receiptState"],
          });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      <OptionPickerSheet
        isOpen={activePicker === "recurring"}
        title="Recorrente"
        selected={draft.recurringState}
        options={FILTER_RECURRING_OPTIONS}
        getLabel={(option) =>
          FILTER_RECURRING_LABELS[option as HomeFiltersState["recurringState"]]
        }
        onSelect={(option) => {
          updateDraft({
            recurringState: option as HomeFiltersState["recurringState"],
          });
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
