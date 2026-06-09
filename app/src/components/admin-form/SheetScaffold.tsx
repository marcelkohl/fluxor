import type { ReactNode } from "react";

interface SheetScaffoldProps {
  isOpen: boolean;
  titleId?: string;
  zIndexClass?: string;
  onClose: () => void;
  children: ReactNode;
}

export function SheetScaffold({
  isOpen,
  titleId,
  zIndexClass = "z-50",
  onClose,
  children,
}: SheetScaffoldProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex flex-col justify-end`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-background/80"
        onClick={onClose}
      />

      <div className="relative mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
