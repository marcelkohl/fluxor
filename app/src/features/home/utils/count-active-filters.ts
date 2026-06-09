import type { HomeFiltersState } from "@/features/home/state/home-state.types";

/** Conta quantos filtros estão ativos (V1 — seleção única). */
export function countActiveFilters(filters: HomeFiltersState): number {
  let count = 0;

  if (filters.startDate) {
    count += 1;
  }

  if (filters.endDate) {
    count += 1;
  }

  if (filters.type !== "all") {
    count += 1;
  }

  if (filters.status !== "all") {
    count += 1;
  }

  if (filters.categoryId) {
    count += 1;
  }

  if (filters.payeeId) {
    count += 1;
  }

  if (filters.minValue !== null) {
    count += 1;
  }

  if (filters.maxValue !== null) {
    count += 1;
  }

  if (filters.documentState !== "all") {
    count += 1;
  }

  if (filters.receiptState !== "all") {
    count += 1;
  }

  if (filters.recurringState !== "all") {
    count += 1;
  }

  return count;
}
