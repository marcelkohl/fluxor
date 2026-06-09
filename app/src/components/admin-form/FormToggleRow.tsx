interface FormToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function FormToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: FormToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm text-text-secondary">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-link"
      />
    </label>
  );
}
