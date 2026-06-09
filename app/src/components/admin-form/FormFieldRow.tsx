import type { ReactNode } from "react";

import { ThemeIcon } from "@/config/theme";

interface FormFieldRowProps {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function FormFieldRow({
  label,
  value,
  onClick,
  showChevron = true,
}: FormFieldRowProps) {
  const content = (
    <>
      <span className="shrink-0 text-sm text-text-secondary">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-2">
        <span className="min-w-0 text-sm font-medium text-text-primary">{value}</span>
        {showChevron && onClick ? (
          <ThemeIcon
            name="chevronRight"
            size="sm"
            className="shrink-0 text-text-secondary"
          />
        ) : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex items-center justify-between gap-3 py-3">{content}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-surface-soft/60"
    >
      {content}
    </button>
  );
}
