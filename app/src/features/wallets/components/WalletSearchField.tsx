import { AdminSearchField } from "@/components/admin-form";

interface WalletSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function WalletSearchField({ value, onChange }: WalletSearchFieldProps) {
  return (
    <AdminSearchField
      value={value}
      onChange={onChange}
      placeholder="Buscar carteiras..."
      ariaLabel="Buscar carteiras"
    />
  );
}
