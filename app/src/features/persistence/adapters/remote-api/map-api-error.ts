import type { ApiErrorCode, ApiErrorResponse } from "@fluxor/contracts";

import { NotFoundError, ValidationError } from "@/features/database";

const NOT_FOUND_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  wallet_not_found: "Carteira não encontrada",
  category_not_found: "Categoria não encontrada",
  payee_not_found: "Favorecido não encontrado",
  financial_record_not_found: "Registro financeiro não encontrado",
  attachment_not_found: "Anexo não encontrado",
  transfer_link_not_found: "Vínculo de transferência não encontrado",
  recurrence_batch_not_found: "Lote de recorrência não encontrado",
};

const VALIDATION_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  wallet_archived: "Carteira arquivada não pode ser usada",
  wallet_archived_cannot_be_default:
    "Carteira arquivada não pode ser definida como padrão",
  financial_record_already_completed: "Registro já foi efetivado",
  financial_record_not_completed: "Registro não está efetivado",
  financial_record_is_transfer:
    "Registro de transferência deve ser alterado pelo fluxo de transferência",
  no_fields_to_update: "Informe ao menos um campo para atualizar",
  invalid_date: "Data inválida",
  invalid_amount: "Valor inválido",
};

export function mapApiError(
  error: ApiErrorResponse | null,
  status: number,
): Error {
  if (error?.code) {
    const notFoundMessage = NOT_FOUND_MESSAGES[error.code];
    if (notFoundMessage) {
      return new NotFoundError(notFoundMessage);
    }

    const validationMessage = VALIDATION_MESSAGES[error.code];
    if (validationMessage) {
      return new ValidationError(validationMessage);
    }

    if (error.code === "validation_error") {
      return new ValidationError(error.message || "Dados inválidos");
    }
  }

  if (status === 404) {
    return new NotFoundError("Recurso não encontrado");
  }

  if (status >= 400 && status < 500) {
    return new ValidationError(error?.message ?? "Requisição inválida");
  }

  return new Error(error?.message ?? "Falha na comunicação com o servidor");
}
