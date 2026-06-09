import { ValidationError } from "../errors";

export function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(`${field} é obrigatório`);
  }
  return trimmed;
}

export function requireAtLeastOneField(
  fields: Record<string, unknown>,
  label = "Campo",
): void {
  const hasValue = Object.values(fields).some((value) => value !== undefined);
  if (!hasValue) {
    throw new ValidationError(`${label}: informe ao menos um campo para alterar`);
  }
}
