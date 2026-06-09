import type { WidgetDefinition } from "@/features/widgets/types";

import { widgetRegistry } from "./widget-registry";

const LEGACY_WIDGET_IDS: Record<string, string> = {
  "financial-calendar-placeholder": "financial-calendar",
};

function getRegistryById(): Record<string, WidgetDefinition> {
  return Object.fromEntries(
    widgetRegistry.map((widget) => [widget.id, widget]),
  );
}

export function normalizeEnabledWidgetIds(enabledWidgetIds: string[]): string[] {
  const registryById = getRegistryById();
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawId of enabledWidgetIds) {
    const id = LEGACY_WIDGET_IDS[rawId] ?? rawId;

    if (seen.has(id) || registryById[id] === undefined) {
      continue;
    }

    seen.add(id);
    normalized.push(id);
  }

  return normalized;
}

export function getEnabledWidgets(enabledIds: string[]): WidgetDefinition[] {
  const registryById = getRegistryById();
  const normalizedIds = normalizeEnabledWidgetIds(enabledIds);

  return normalizedIds
    .map((id) => registryById[id])
    .filter((widget): widget is WidgetDefinition => widget !== undefined);
}

export interface ResolvedWidgetCarousel {
  widgets: WidgetDefinition[];
  activeWidgetId: string;
  activeIndex: number;
}

export function resolveWidgetCarousel(
  enabledWidgetIds: string[],
  activeWidgetId: string,
): ResolvedWidgetCarousel {
  const widgets = getEnabledWidgets(enabledWidgetIds);

  if (widgets.length === 0) {
    return { widgets: [], activeWidgetId: "", activeIndex: -1 };
  }

  const migratedActiveId = LEGACY_WIDGET_IDS[activeWidgetId] ?? activeWidgetId;
  let activeIndex = widgets.findIndex((widget) => widget.id === migratedActiveId);

  if (activeIndex < 0) {
    activeIndex = 0;
  }

  return {
    widgets,
    activeWidgetId: widgets[activeIndex].id,
    activeIndex,
  };
}
