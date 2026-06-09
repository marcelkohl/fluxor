interface FormInputRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function FormInputRow({
  label,
  value,
  placeholder,
  onChange,
}: FormInputRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="shrink-0 text-sm text-text-secondary">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-text-primary placeholder:text-muted outline-none"
      />
    </label>
  );
}
