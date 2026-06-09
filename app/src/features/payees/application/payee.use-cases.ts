import { NotFoundError, ValidationError } from "@/features/database";
import {
  requireAtLeastOneField,
  requireNonEmpty,
} from "@/features/database/utils";
import { resolvePersistence } from "@/features/persistence";
import type { PayeeRepositoryPort } from "@/features/persistence/ports";

import type {
  CreatePayeeData,
  Payee,
  PayeeDocument,
  PayeePaymentMethod,
  UpdatePayeeData,
} from "../domain";

export interface CreatePayeeInput {
  name: string;
  notes?: string | null;
}

export async function listPayees(): Promise<Payee[]> {
  const { payees } = await resolvePersistence();
  return payees.listActive();
}

export async function listPayeeDocuments(
  payeeId: string,
): Promise<PayeeDocument[]> {
  const { payees, payeeDocuments } = await resolvePersistence();

  const payee = await payees.getById(payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }

  return payeeDocuments.listByPayee(payeeId);
}

export async function listPayeePaymentMethods(
  payeeId: string,
): Promise<PayeePaymentMethod[]> {
  const { payees, payeePaymentMethods } = await resolvePersistence();

  const payee = await payees.getById(payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }

  return payeePaymentMethods.listByPayee(payeeId);
}

export async function createPayee(input: CreatePayeeInput): Promise<Payee> {
  const { payees } = await resolvePersistence();

  const data: CreatePayeeData = {
    name: requireNonEmpty(input.name, "Nome"),
    notes: input.notes ?? null,
  };

  return payees.create(data);
}

export interface CreatePayeeQuickInput {
  name: string;
}

/** Atalho UX — delega a createPayee com apenas name. */
export async function createPayeeQuick(
  input: CreatePayeeQuickInput,
): Promise<Payee> {
  return createPayee({ name: input.name });
}

export interface UpdatePayeeInput {
  payeeId: string;
  name?: string;
  notes?: string | null;
}

export async function updatePayee(input: UpdatePayeeInput): Promise<Payee> {
  const { payees } = await resolvePersistence();

  requireAtLeastOneField(
    { name: input.name, notes: input.notes },
    "Favorecido",
  );

  const existing = await payees.getById(input.payeeId);
  if (!existing) {
    throw new NotFoundError("Favorecido não encontrado");
  }

  const data: UpdatePayeeData = {};
  if (input.name !== undefined) {
    data.name = requireNonEmpty(input.name, "Nome");
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
  }

  return payees.update(input.payeeId, data);
}

export async function archivePayee(payeeId: string): Promise<Payee> {
  const { payees } = await resolvePersistence();

  const existing = await payees.getById(payeeId);
  if (!existing) {
    throw new NotFoundError("Favorecido não encontrado");
  }
  if (existing.isArchived) {
    throw new ValidationError("Favorecido já está arquivado");
  }

  return payees.archive(payeeId);
}

async function requireActivePayee(
  payees: PayeeRepositoryPort,
  payeeId: string,
): Promise<Payee> {
  const payee = await payees.getById(payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }
  if (payee.isArchived) {
    throw new ValidationError("Favorecido arquivado");
  }
  return payee;
}

export interface CreatePayeeDocumentInput {
  payeeId: string;
  type: string;
  value: string;
}

export async function createPayeeDocument(
  input: CreatePayeeDocumentInput,
): Promise<PayeeDocument> {
  const { payees, payeeDocuments } = await resolvePersistence();

  await requireActivePayee(payees, input.payeeId);

  return payeeDocuments.create({
    payeeId: input.payeeId,
    type: requireNonEmpty(input.type, "Tipo"),
    value: requireNonEmpty(input.value, "Valor"),
  });
}

export async function removePayeeDocument(
  documentId: string,
): Promise<void> {
  const { payees, payeeDocuments } = await resolvePersistence();

  const document = await payeeDocuments.getById(documentId);
  if (!document) {
    throw new NotFoundError("Documento não encontrado");
  }

  const payee = await payees.getById(document.payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }

  await payeeDocuments.remove(documentId);
}

export interface CreatePayeePaymentMethodInput {
  payeeId: string;
  type: string;
  value: string;
}

export async function createPayeePaymentMethod(
  input: CreatePayeePaymentMethodInput,
): Promise<PayeePaymentMethod> {
  const { payees, payeePaymentMethods } = await resolvePersistence();

  await requireActivePayee(payees, input.payeeId);

  return payeePaymentMethods.create({
    payeeId: input.payeeId,
    type: requireNonEmpty(input.type, "Tipo"),
    value: requireNonEmpty(input.value, "Valor"),
  });
}

export async function removePayeePaymentMethod(
  paymentMethodId: string,
): Promise<void> {
  const { payees, payeePaymentMethods } = await resolvePersistence();

  const method = await payeePaymentMethods.getById(paymentMethodId);
  if (!method) {
    throw new NotFoundError("Forma de pagamento não encontrada");
  }

  const payee = await payees.getById(method.payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }

  await payeePaymentMethods.remove(paymentMethodId);
}
