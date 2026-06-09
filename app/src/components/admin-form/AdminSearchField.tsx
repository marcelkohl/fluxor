import { ThemeIcon } from "@/config/theme";

interface AdminSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

export function AdminSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: AdminSearchFieldProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
        <ThemeIcon name="filters" size="sm" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-text-primary placeholder:text-muted outline-none transition-colors focus:border-link"
        aria-label={ariaLabel}
      />
    </div>
  );
}
