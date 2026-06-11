import type { ReactNode } from "react";

interface FormSectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function FormSectionHeader({ title, action }: FormSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 pb-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h3>
      {action}
    </div>
  );
}
