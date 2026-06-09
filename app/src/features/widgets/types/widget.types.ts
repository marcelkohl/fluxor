import type { ComponentType } from "react";

import type { HomeWidgetContext } from "./home-widget-context.types";

export interface WidgetProps {
  context: HomeWidgetContext;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  component: ComponentType<WidgetProps>;
}
