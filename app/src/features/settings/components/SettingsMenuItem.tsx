import { ThemeIcon, type ThemeIconName } from "@/config/theme";

interface SettingsMenuItemProps {
  title: string;
  subtitle: string;
  icon: ThemeIconName;
  enabled?: boolean;
  onClick?: () => void;
}

export function SettingsMenuItem({
  title,
  subtitle,
  icon,
  enabled = false,
  onClick,
}: SettingsMenuItemProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-colors disabled:opacity-100 ${
        enabled
          ? "text-text-primary hover:bg-surface-soft active:bg-surface-soft"
          : "cursor-default opacity-50"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          enabled
            ? "bg-link-soft text-link"
            : "bg-surface-soft text-muted"
        }`}
        aria-hidden
      >
        <ThemeIcon name={icon} size="md" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm ${
            enabled
              ? "font-semibold text-text-primary"
              : "font-medium text-text-secondary"
          }`}
        >
          {title}
        </span>
        <span
          className={`mt-0.5 block text-xs leading-snug ${
            enabled ? "text-text-secondary" : "text-muted"
          }`}
        >
          {subtitle}
        </span>
      </span>

      <ThemeIcon
        name="chevronRight"
        size="sm"
        className={`shrink-0 ${enabled ? "text-text-secondary" : "text-muted"}`}
      />
    </button>
  );
}
