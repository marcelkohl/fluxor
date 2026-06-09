import { useEffect } from "react";

interface ToastBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ToastBanner({ message, onDismiss }: ToastBannerProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[70] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium whitespace-pre-line text-text-primary shadow-lg"
    >
      {message}
    </div>
  );
}
