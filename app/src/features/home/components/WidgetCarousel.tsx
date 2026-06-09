import { useEffect, useMemo } from "react";

import type { HomeWidgetContext } from "@/features/widgets/types";
import { resolveWidgetCarousel } from "@/features/widgets/registry";

interface WidgetCarouselProps {
  widgetContext: HomeWidgetContext;
  enabledWidgetIds: string[];
  activeWidgetId: string;
  onActiveWidgetChange: (widgetId: string) => void;
}

export function WidgetCarousel({
  widgetContext,
  enabledWidgetIds,
  activeWidgetId,
  onActiveWidgetChange,
}: WidgetCarouselProps) {
  const { widgets, activeWidgetId: resolvedActiveWidgetId, activeIndex } =
    useMemo(
      () => resolveWidgetCarousel(enabledWidgetIds, activeWidgetId),
      [enabledWidgetIds, activeWidgetId],
    );

  useEffect(() => {
    if (
      resolvedActiveWidgetId &&
      resolvedActiveWidgetId !== activeWidgetId
    ) {
      onActiveWidgetChange(resolvedActiveWidgetId);
    }
  }, [activeWidgetId, onActiveWidgetChange, resolvedActiveWidgetId]);

  if (widgets.length === 0) {
    return (
      <section className="px-4">
        <div className="flex h-60 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-soft px-4 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum widget habilitado
          </p>
        </div>
      </section>
    );
  }

  const ActiveWidget = widgets[activeIndex]?.component;

  return (
    <section className="px-4">
      <div className="h-60 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft">
        {ActiveWidget ? <ActiveWidget context={widgetContext} /> : null}
      </div>

      {widgets.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-1">
          {widgets.map((widget, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={widget.id}
                type="button"
                aria-label={`Widget ${widget.name}`}
                aria-current={isActive}
                onClick={() => onActiveWidgetChange(widget.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full"
              >
                <span
                  className={`block rounded-full transition-all ${
                    isActive ? "h-1.5 w-4 bg-primary" : "h-1.5 w-1.5 bg-border"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
