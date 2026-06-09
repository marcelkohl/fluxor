import { getEnabledWidgets } from "@/features/widgets/registry";
import type { HomeWidgetContext } from "@/features/widgets/types";

interface WidgetStackProps {
  widgetContext: HomeWidgetContext;
  enabledWidgetIds: string[];
}

export function WidgetStack({
  widgetContext,
  enabledWidgetIds,
}: WidgetStackProps) {
  const widgets = getEnabledWidgets(enabledWidgetIds);

  if (widgets.length === 0) {
    return (
      <div className="flex min-h-[15rem] items-center justify-center rounded-xl border border-border bg-surface-soft px-4 text-center">
        <p className="text-sm text-text-secondary">Nenhum widget habilitado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {widgets.map((widget) => {
        const WidgetComponent = widget.component;

        return (
          <section
            key={widget.id}
            className="shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft"
            aria-label={widget.name}
          >
            <div className="h-60">
              <WidgetComponent context={widgetContext} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
