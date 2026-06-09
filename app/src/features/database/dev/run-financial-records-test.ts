import { isTauri } from "@tauri-apps/api/core";

import { themeColorPalette } from "@/config/theme/theme.palette";
import { createCategory } from "@/features/categories";
import {
  ensureDatabaseReady,
  getDatabaseService,
  initializeDatabase,
} from "@/features/database";
import {
  appendHistoryEvent,
  createAttachment,
  createFinancialRecord,
  createRecurrenceBatch,
  createTransferLink,
  getFinancialRecordById,
  getRecurrenceBatch,
  getTransferLink,
  listAttachmentsByRecord,
  listFinancialRecords,
  listHistoryByRecord,
  removeAttachment,
  updateFinancialRecord,
} from "@/features/financial-records";
import { createWallet } from "@/features/wallets";

export interface FinancialRecordsTestResult {
  ranAt: string;
  environment: "tauri" | "browser";
  success: boolean;
  message?: string;
  created?: {
    wallet: unknown;
    category: unknown;
    record: unknown;
    attachment: unknown;
    transferLink: unknown;
    recurrenceBatch: unknown;
  };
  lists?: {
    records: unknown[];
    attachments: unknown[];
    attachmentsAfterRemove: unknown[];
    history: unknown[];
  };
  error?: string;
}

export async function runFinancialRecordsTest(): Promise<FinancialRecordsTestResult> {
  const ranAt = new Date().toISOString();

  if (!isTauri()) {
    return {
      ranAt,
      environment: "browser",
      success: false,
      message: "SQLite disponível apenas no Tauri",
    };
  }

  const ts = Date.now();
  const suffix = `dev-${ts}`;

  try {
    await initializeDatabase();
    const status = getDatabaseService().getState();
    if (status.status !== "ready") {
      return {
        ranAt,
        environment: "tauri",
        success: false,
        message: status.message ?? "Banco não está pronto",
        error: status.message,
      };
    }

    await ensureDatabaseReady();

    const wallet = await createWallet({
      name: `Carteira Records ${suffix}`,
      icon: "wallet",
      color: themeColorPalette[0],
    });

    const category = await createCategory({
      name: `Categoria Records ${suffix}`,
      icon: "categoryFood",
      color: themeColorPalette[1],
    });

    const record = await createFinancialRecord({
      walletId: wallet.id,
      type: "payable",
      description: `Conta teste ${suffix}`,
      categoryId: category.id,
      dueDate: "2026-06-15",
      expectedAmount: 12900,
    });

    const updated = await updateFinancialRecord({
      recordId: record.id,
      description: `Conta teste atualizada ${suffix}`,
    });

    const attachment = await createAttachment({
      recordId: updated.id,
      kind: "document",
      filename: "boleto.pdf",
      mimeType: "application/pdf",
      size: 1024,
      localPath: `/tmp/fluxor/${suffix}/boleto.pdf`,
      label: "Boleto",
    });

    const record2 = await createFinancialRecord({
      walletId: wallet.id,
      type: "receivable",
      description: `Destino transferência ${suffix}`,
      categoryId: category.id,
      dueDate: "2026-06-15",
      expectedAmount: 50000,
    });

    const transferLink = await createTransferLink({
      sourceRecordId: updated.id,
      targetRecordId: record2.id,
    });

    const recurrenceBatch = await createRecurrenceBatch({
      ruleDescription: `Mensal ${suffix}`,
      startDate: "2026-06-01",
      occurrenceCount: 3,
    });

    await appendHistoryEvent({
      recordId: updated.id,
      eventType: "alert_created",
      description: "Alerta configurado",
    });

    const attachments = await listAttachmentsByRecord(updated.id);
    const history = await listHistoryByRecord(updated.id);
    const records = await listFinancialRecords({ walletId: wallet.id });

    await removeAttachment(attachment.id);
    const attachmentsAfterRemove = await listAttachmentsByRecord(updated.id);

    await getFinancialRecordById(updated.id);
    await getTransferLink(transferLink.id);
    await getRecurrenceBatch(recurrenceBatch.id);

    return {
      ranAt,
      environment: "tauri",
      success: true,
      message: "Infraestrutura FinancialRecord exercitada com sucesso",
      created: {
        wallet,
        category,
        record: updated,
        attachment,
        transferLink,
        recurrenceBatch,
      },
      lists: {
        records,
        attachments,
        attachmentsAfterRemove,
        history,
      },
    };
  } catch (error) {
    return {
      ranAt,
      environment: "tauri",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
