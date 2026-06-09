import type { HomeFiltersState, HomeState } from "./home-state.types";
import { createEmptyHomeFiltersState } from "./home-state.types";
import { initialHomeState } from "./home-state.mock";
import {
  normalizeEnabledWidgetIds,
  resolveWidgetCarousel,
} from "@/features/widgets/registry/widget-carousel-state";

type StateListener = () => void;

function areWidgetIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => id === right[index]);
}

function normalizeWidgetState(state: HomeState): HomeState {
  const enabledWidgetIds = normalizeEnabledWidgetIds(state.enabledWidgetIds);
  const { activeWidgetId } = resolveWidgetCarousel(
    enabledWidgetIds,
    state.activeWidgetId,
  );

  if (
    areWidgetIdsEqual(enabledWidgetIds, state.enabledWidgetIds) &&
    activeWidgetId === state.activeWidgetId
  ) {
    return state;
  }

  return {
    ...state,
    enabledWidgetIds,
    activeWidgetId,
  };
}

/**
 * Serviço de estado operacional da Home.
 *
 * Mantém estado em memória nesta etapa.
 * Futuramente poderá ser persistido em SQLite ou preferências locais.
 */
export interface HomeStateService {
  getState(): HomeState;
  setActiveAccount(accountId: string): void;
  setSelectedMonth(month: number): void;
  setSelectedYear(year: number): void;
  setSelectedMonthFromIsoDate(isoDate: string): void;
  shiftSelectedMonth(delta: number): void;
  setActiveWidget(widgetId: string): void;
  updateFilters(partial: Partial<HomeFiltersState>): void;
  setFilters(filters: HomeFiltersState): void;
  resetFilters(): void;
  subscribe(listener: StateListener): () => void;
}

class InMemoryHomeStateService implements HomeStateService {
  private state: HomeState = normalizeWidgetState({ ...initialHomeState });
  private listeners = new Set<StateListener>();

  getState(): HomeState {
    const normalized = normalizeWidgetState(this.state);

    if (normalized !== this.state) {
      this.state = normalized;
    }

    return this.state;
  }

  setActiveAccount(accountId: string): void {
    this.state = { ...this.state, activeAccountId: accountId };
    this.emit();
  }

  setSelectedMonth(month: number): void {
    this.state = { ...this.state, selectedMonth: month };
    this.emit();
  }

  setSelectedYear(year: number): void {
    this.state = { ...this.state, selectedYear: year };
    this.emit();
  }

  setSelectedMonthFromIsoDate(isoDate: string): void {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(isoDate.trim());
    if (!match) {
      return;
    }

    this.state = {
      ...this.state,
      selectedYear: Number(match[1]),
      selectedMonth: Number(match[2]),
    };
    this.emit();
  }

  shiftSelectedMonth(delta: number): void {
    let { selectedMonth, selectedYear } = this.state;
    selectedMonth += delta;

    if (selectedMonth < 1) {
      selectedMonth = 12;
      selectedYear -= 1;
    } else if (selectedMonth > 12) {
      selectedMonth = 1;
      selectedYear += 1;
    }

    this.state = { ...this.state, selectedMonth, selectedYear };
    this.emit();
  }

  setActiveWidget(widgetId: string): void {
    const { widgets } = resolveWidgetCarousel(
      this.state.enabledWidgetIds,
      widgetId,
    );
    const target = widgets.find((widget) => widget.id === widgetId);

    if (!target) {
      return;
    }

    this.state = { ...this.state, activeWidgetId: target.id };
    this.emit();
  }

  updateFilters(partial: Partial<HomeFiltersState>): void {
    this.state = {
      ...this.state,
      filters: { ...this.state.filters, ...partial },
    };
    this.emit();
  }

  setFilters(filters: HomeFiltersState): void {
    this.state = {
      ...this.state,
      filters: { ...filters },
    };
    this.emit();
  }

  resetFilters(): void {
    this.state = {
      ...this.state,
      filters: createEmptyHomeFiltersState(),
    };
    this.emit();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** Instância singleton — ponto de acesso ao estado operacional da Home. */
export const homeStateService: HomeStateService = new InMemoryHomeStateService();
