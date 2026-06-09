import type { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  /** Apenas a Home usa layout largo no desktop; demais telas ficam em max-w-md. */
  wide?: boolean;
}

export function MainLayout({ children, wide = false }: MainLayoutProps) {
  return (
    <div
      className={`mx-auto flex h-dvh w-full flex-col overflow-hidden bg-background ${
        wide ? "max-w-md lg:max-w-[1200px]" : "max-w-md"
      }`}
    >
      {children}
    </div>
  );
}
