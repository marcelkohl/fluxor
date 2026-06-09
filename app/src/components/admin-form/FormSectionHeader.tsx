interface FormSectionHeaderProps {
  title: string;
}

export function FormSectionHeader({ title }: FormSectionHeaderProps) {
  return (
    <div className="pt-4 pb-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h3>
    </div>
  );
}
