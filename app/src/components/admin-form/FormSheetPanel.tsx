import type { ReactNode } from "react";

interface FormSheetPanelProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function FormSheetPanel({ children, footer }: FormSheetPanelProps) {
  return (
    <div className="flex max-h-[85vh] flex-col rounded-t-xl border-t border-border bg-surface shadow-lg">
      {children}
      {footer}
    </div>
  );
}
