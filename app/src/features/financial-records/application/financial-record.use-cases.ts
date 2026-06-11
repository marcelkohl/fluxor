import { NotFoundError, ValidationError } from "@/features/database";
import {
  requireAtLeastOneField,
  requireNonEmpty,
} from "@/features/database/utils";
import { resolvePersistence } from "@/features/persistence";
import type {
  CategoryRepositoryPort,
  FinancialRecordRepositoryPort,
  PayeeRepositoryPort,
  WalletRepositoryPort,
} from "@/features/persistence/ports";

import type {
  Attachment,
  AppendHistoryEventData,
  CreateAttachmentData,
  CreateFinancialRecordData,
  CreateRecurrenceBatchData,
  CreateTransferLinkData,
  FinancialRecord,
  FinancialRecordHistoryEvent,
  FinancialRecordType,
  HistoryEventType,
  ListFinancialRecordsFilter,
  RecurrenceBatch,
  TransferLink,
  UpdateFinancialRecordData,
} from "../domain";

const RECORD_TYPES: readonly FinancialRecordType[] = ["payable", "receivable"];
const ATTACHMENT_KINDS = ["document", "receipt"] as const;

const HISTORY_EVENT_TYPES: readonly HistoryEventType[] = [
  "record_created",
  "record_updated",
  "payment_registered",
  "payment_reverted",
  "attachment_added",
  "attachment_removed",
  "transfer_created",
  "transfer_updated",
  "alert_created",
];

function validateRecordType(type: string): FinancialRecordType {
  if (!RECORD_TYPES.includes(type as FinancialRecordType)) {
    throw new ValidationError("Tipo de registro inválido");
  }
  return type as FinancialRecordType;
}

function validateAmount(amount: number, label: string): number {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError(`${label} deve ser um inteiro ≥ 0 (centavos)`);
  }
  return amount;
}

function validateDueDate(dueDate: string): string {
  const value = requireNonEmpty(dueDate, "Data de vencimento");
  if (Number.isNaN(Date.parse(value))) {
    throw new ValidationError("Data de vencimento inválida");
  }
  return value;
}

function validateHistoryEventType(eventType: string): HistoryEventType {
  if (!HISTORY_EVENT_TYPES.includes(eventType as HistoryEventType)) {
    throw new ValidationError("Tipo de evento inválido");
  }
  return eventType as HistoryEventType;
}

async function ensureActiveWallet(
  walletRepo: WalletRepositoryPort,
  walletId: string,
): Promise<void> {
  const wallet = await walletRepo.getById(walletId);
  if (!wallet) {
    throw new NotFoundError("Carteira não encontrada");
  }
  if (wallet.isArchived) {
    throw new ValidationError("Carteira arquivada não pode ser usada");
  }
}

async function ensureActiveCategory(
  categoryRepo: CategoryRepositoryPort,
  categoryId: string,
): Promise<void> {
  const category = await categoryRepo.getById(categoryId);
  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }
  if (category.isArchived) {
    throw new ValidationError("Categoria arquivada não pode ser usada");
  }
}

async function ensurePayeeIfProvided(
  payeeRepo: PayeeRepositoryPort,
  payeeId: string | null | undefined,
): Promise<void> {
  if (payeeId == null) {
    return;
  }
  const payee = await payeeRepo.getById(payeeId);
  if (!payee) {
    throw new NotFoundError("Favorecido não encontrado");
  }
}

async function ensureRecordExists(
  recordRepo: FinancialRecordRepositoryPort,
  recordId: string,
): Promise<FinancialRecord> {
  const record = await recordRepo.getById(recordId);
  if (!record) {
    throw new NotFoundError("Registro financeiro não encontrado");
  }
  return record;
}

export interface CreateFinancialRecordInput {
  walletId: string;
  type: FinancialRecordType;
  description: string;
  categoryId: string;
  dueDate: string;
  expectedAmount: number;
  payeeId?: string | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
}

export async function createFinancialRecord(
  input: CreateFinancialRecordInput,
): Promise<FinancialRecord> {
  const persistence = await resolvePersistence();
  const { wallets, categories, payees, financialRecords, financialRecordHistory } =
    persistence;

  await ensureActiveWallet(wallets, input.walletId);
  await ensureActiveCategory(categories, input.categoryId);
  await ensurePayeeIfProvided(payees, input.payeeId);

  const data: CreateFinancialRecordData = {
    walletId: input.walletId,
    type: validateRecordType(input.type),
    description: requireNonEmpty(input.description, "Descrição"),
    categoryId: input.categoryId,
    dueDate: validateDueDate(input.dueDate),
    expectedAmount: validateAmount(input.expectedAmount, "Valor previsto"),
    payeeId: input.payeeId ?? null,
    recordNote: input.recordNote ?? null,
    alertEnabled: input.alertEnabled ?? false,
    alertOffset: input.alertOffset ?? null,
    storedStatus: "pending",
  };

  const record = await financialRecords.create(data);

  await financialRecordHistory.appendEvent({
    recordId: record.id,
    eventType: "record_created",
    description: "Registro criado",
  });

  return record;
}

export interface UpdateFinancialRecordInput {
  recordId: string;
  description?: string;
  categoryId?: string;
  dueDate?: string;
  expectedAmount?: number;
  payeeId?: string | null;
  recordNote?: string | null;
  alertEnabled?: boolean;
  alertOffset?: number | null;
}

export async function updateFinancialRecord(
  input: UpdateFinancialRecordInput,
): Promise<FinancialRecord> {
  const persistence = await resolvePersistence();
  const { categories, payees, financialRecords, financialRecordHistory } =
    persistence;

  requireAtLeastOneField(
    {
      description: input.description,
      categoryId: input.categoryId,
      dueDate: input.dueDate,
      expectedAmount: input.expectedAmount,
      payeeId: input.payeeId,
      recordNote: input.recordNote,
      alertEnabled: input.alertEnabled,
      alertOffset: input.alertOffset,
    },
    "Registro financeiro",
  );

  const existing = await ensureRecordExists(financialRecords, input.recordId);

  if (existing.transferGroupId) {
    throw new ValidationError(
      "Registro de transferência deve ser alterado pelo fluxo de transferência",
    );
  }

  if (existing.storedStatus === "completed") {
    throw new ValidationError(
      "Registro efetivado não pode ser alterado por este serviço",
    );
  }

  const data: UpdateFinancialRecordData = {};

  if (input.description !== undefined) {
    data.description = requireNonEmpty(input.description, "Descrição");
  }
  if (input.categoryId !== undefined) {
    await ensureActiveCategory(categories, input.categoryId);
    data.categoryId = input.categoryId;
  }
  if (input.dueDate !== undefined) {
    data.dueDate = validateDueDate(input.dueDate);
  }
  if (input.expectedAmount !== undefined) {
    data.expectedAmount = validateAmount(input.expectedAmount, "Valor previsto");
  }
  if (input.payeeId !== undefined) {
    await ensurePayeeIfProvided(payees, input.payeeId);
    data.payeeId = input.payeeId;
  }
  if (input.recordNote !== undefined) {
    data.recordNote = input.recordNote;
  }
  if (input.alertEnabled !== undefined) {
    data.alertEnabled = input.alertEnabled;
  }
  if (input.alertOffset !== undefined) {
    data.alertOffset = input.alertOffset;
  }

  const updated = await financialRecords.update(input.recordId, data);

  await financialRecordHistory.appendEvent({
    recordId: updated.id,
    eventType: "record_updated",
    description: "Registro alterado",
  });

  return updated;
}

export async function archiveFinancialRecord(
  recordId: string,
): Promise<FinancialRecord> {
  const { financialRecords } = await resolvePersistence();

  const existing = await ensureRecordExists(financialRecords, recordId);

  if (existing.transferGroupId) {
    throw new ValidationError(
      "Registro de transferência não pode ser excluído isoladamente",
    );
  }

  return financialRecords.archive(recordId);
}

export async function getFinancialRecordById(
  recordId: string,
): Promise<FinancialRecord> {
  const { financialRecords } = await resolvePersistence();
  return ensureRecordExists(financialRecords, recordId);
}

export async function listFinancialRecords(
  filter: ListFinancialRecordsFilter = {},
): Promise<FinancialRecord[]> {
  const { financialRecords } = await resolvePersistence();
  return financialRecords.list(filter);
}

export interface RegisterPaymentInput {
  recordId: string;
  effectiveAmount: number;
  effectiveDate: string;
  paymentNote?: string | null;
}

function formatPaymentHistoryDescription(
  recordType: FinancialRecordType,
  effectiveAmount: number,
  effectiveDate: string,
): string {
  const amountLabel = (effectiveAmount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const [year, month, day] = effectiveDate.split("-");
  const dateLabel = `${day}/${month}/${year}`;
  const actionLabel =
    recordType === "payable" ? "Pagamento" : "Recebimento";

  return `${actionLabel} de ${amountLabel} em ${dateLabel}`;
}

export async function registerPayment(
  input: RegisterPaymentInput,
): Promise<FinancialRecord> {
  const { financialRecords, financialRecordHistory } = await resolvePersistence();

  const existing = await ensureRecordExists(financialRecords, input.recordId);

  if (existing.storedStatus === "completed") {
    throw new ValidationError("Registro já foi efetivado");
  }

  if (existing.transferGroupId) {
    throw new ValidationError(
      "Registro de transferência deve ser efetivado pelo fluxo de transferência",
    );
  }

  const effectiveDate = validateDueDate(input.effectiveDate);
  const effectiveAmount = validateAmount(
    input.effectiveAmount,
    "Valor efetivado",
  );

  const updated = await financialRecords.registerPayment(input.recordId, {
    effectiveDate,
    effectiveAmount,
    paymentNote: input.paymentNote?.trim() ? input.paymentNote.trim() : null,
  });

  await financialRecordHistory.appendEvent({
    recordId: updated.id,
    eventType: "payment_registered",
    description: formatPaymentHistoryDescription(
      existing.type,
      effectiveAmount,
      effectiveDate,
    ),
  });

  return updated;
}

export async function revertPayment(recordId: string): Promise<FinancialRecord> {
  const { financialRecords, financialRecordHistory } = await resolvePersistence();

  const existing = await ensureRecordExists(financialRecords, recordId);

  if (existing.storedStatus !== "completed") {
    throw new ValidationError("Registro não está efetivado");
  }

  if (existing.transferGroupId) {
    throw new ValidationError(
      "Registro de transferência deve ser revertido pelo fluxo de transferência",
    );
  }

  const updated = await financialRecords.revertPayment(recordId);

  await financialRecordHistory.appendEvent({
    recordId: updated.id,
    eventType: "payment_reverted",
    description: "Efetivação revertida",
  });

  return updated;
}

export interface CreateAttachmentInput {
  recordId: string;
  kind: CreateAttachmentData["kind"];
  filename: string;
  mimeType: string;
  size: number;
  localPath: string;
  label?: string | null;
}

export async function createAttachment(
  input: CreateAttachmentInput,
): Promise<Attachment> {
  const { financialRecords, attachments, financialRecordHistory } =
    await resolvePersistence();

  await ensureRecordExists(financialRecords, input.recordId);

  if (!ATTACHMENT_KINDS.includes(input.kind)) {
    throw new ValidationError("Tipo de anexo inválido");
  }

  const data: CreateAttachmentData = {
    recordId: input.recordId,
    kind: input.kind,
    filename: requireNonEmpty(input.filename, "Nome do arquivo"),
    mimeType: requireNonEmpty(input.mimeType, "Tipo MIME"),
    size: validateAmount(input.size, "Tamanho"),
    localPath: requireNonEmpty(input.localPath, "Caminho local"),
    label: input.label ?? null,
  };

  const attachment = await attachments.create(data);

  await financialRecordHistory.appendEvent({
    recordId: attachment.recordId,
    eventType: "attachment_added",
    description: "Anexo adicionado",
    metadata: JSON.stringify({
      kind: attachment.kind,
      filename: attachment.filename,
    }),
  });

  return attachment;
}

export async function removeAttachment(attachmentId: string): Promise<Attachment> {
  const { attachments, financialRecordHistory } = await resolvePersistence();

  const existing = await attachments.getById(attachmentId);
  if (!existing) {
    throw new NotFoundError("Anexo não encontrado");
  }

  const removed = await attachments.remove(attachmentId);

  await financialRecordHistory.appendEvent({
    recordId: removed.recordId,
    eventType: "attachment_removed",
    description: "Anexo removido",
    metadata: JSON.stringify({
      kind: removed.kind,
      filename: removed.filename,
    }),
  });

  return removed;
}

export async function getAttachmentById(attachmentId: string): Promise<Attachment> {
  const { attachments } = await resolvePersistence();

  const attachment = await attachments.getById(attachmentId);
  if (!attachment) {
    throw new NotFoundError("Anexo não encontrado");
  }

  return attachment;
}

export async function listAttachmentsByRecord(
  recordId: string,
): Promise<Attachment[]> {
  const { financialRecords, attachments } = await resolvePersistence();

  await ensureRecordExists(financialRecords, recordId);
  return attachments.listByRecord(recordId);
}

export interface AppendHistoryEventInput {
  recordId: string;
  eventType: HistoryEventType;
  description: string;
  metadata?: string | null;
  createdBy?: string | null;
}

export async function appendHistoryEvent(
  input: AppendHistoryEventInput,
): Promise<FinancialRecordHistoryEvent> {
  const { financialRecords, financialRecordHistory } = await resolvePersistence();

  await ensureRecordExists(financialRecords, input.recordId);

  const data: AppendHistoryEventData = {
    recordId: input.recordId,
    eventType: validateHistoryEventType(input.eventType),
    description: requireNonEmpty(input.description, "Descrição"),
    metadata: input.metadata ?? null,
    createdBy: input.createdBy ?? null,
  };

  return financialRecordHistory.appendEvent(data);
}

export async function listHistoryByRecord(
  recordId: string,
): Promise<FinancialRecordHistoryEvent[]> {
  const { financialRecords, financialRecordHistory } = await resolvePersistence();

  await ensureRecordExists(financialRecords, recordId);
  return financialRecordHistory.listByRecord(recordId);
}

export interface CreateTransferLinkInput {
  sourceRecordId: string;
  targetRecordId: string;
}

export async function createTransferLink(
  input: CreateTransferLinkInput,
): Promise<TransferLink> {
  const { financialRecords, transferLinks } = await resolvePersistence();

  if (input.sourceRecordId === input.targetRecordId) {
    throw new ValidationError(
      "Registros de origem e destino devem ser distintos",
    );
  }

  await ensureRecordExists(financialRecords, input.sourceRecordId);
  await ensureRecordExists(financialRecords, input.targetRecordId);

  const data: CreateTransferLinkData = {
    sourceRecordId: input.sourceRecordId,
    targetRecordId: input.targetRecordId,
  };

  return transferLinks.create(data);
}

export async function getTransferLink(
  transferLinkId: string,
): Promise<TransferLink> {
  const { transferLinks } = await resolvePersistence();

  const link = await transferLinks.getById(transferLinkId);
  if (!link) {
    throw new NotFoundError("Vínculo de transferência não encontrado");
  }

  return link;
}

export interface CreateRecurrenceBatchInput {
  ruleDescription: string;
  startDate: string;
  endDate?: string | null;
  occurrenceCount: number;
}

export async function createRecurrenceBatch(
  input: CreateRecurrenceBatchInput,
): Promise<RecurrenceBatch> {
  const { recurrenceBatches } = await resolvePersistence();

  if (!Number.isInteger(input.occurrenceCount) || input.occurrenceCount < 1) {
    throw new ValidationError("Quantidade de ocorrências deve ser ≥ 1");
  }

  const data: CreateRecurrenceBatchData = {
    ruleDescription: requireNonEmpty(input.ruleDescription, "Descrição da regra"),
    startDate: validateDueDate(input.startDate),
    endDate: input.endDate ?? null,
    occurrenceCount: input.occurrenceCount,
  };

  return recurrenceBatches.create(data);
}

export async function getRecurrenceBatch(
  batchId: string,
): Promise<RecurrenceBatch> {
  const { recurrenceBatches } = await resolvePersistence();

  const batch = await recurrenceBatches.getById(batchId);
  if (!batch) {
    throw new NotFoundError("Lote de recorrência não encontrado");
  }

  return batch;
}
