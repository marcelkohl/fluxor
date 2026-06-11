import { themeColorPalette } from "@/config/theme/theme.palette";
import { createCategory } from "@/features/categories";
import {
  getDevTestEnvironment,
  isRemoteFeatureNotSupported,
  resolveDevTestContext,
  type DevTestStep,
} from "@/features/database/dev/dev-test-context";
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
  registerPayment,
  removeAttachment,
  revertPayment,
  updateFinancialRecord,
} from "@/features/financial-records";
import { homeStateService } from "@/features/home/state";
import { getActiveAccountId } from "@/features/home/hooks/useActiveAccountId";
import { createWallet } from "@/features/wallets";

import type { DevTestBaseResult } from "./dev-test-context";

export interface FinancialRecordsTestResult extends DevTestBaseResult {
  created?: {
    wallet: unknown;
    walletB?: unknown;
    category: unknown;
    record: unknown;
    attachment?: unknown;
    transferLink?: unknown;
    recurrenceBatch?: unknown;
  };
  lists?: {
    records: unknown[];
    attachments?: unknown[];
    attachmentsAfterRemove?: unknown[];
    history: unknown[];
  };
}

function step(
  name: string,
  status: DevTestStep["status"],
  message?: string,
): DevTestStep {
  return { name, status, message };
}

async function runOptionalStep<T>(
  steps: DevTestStep[],
  name: string,
  action: () => Promise<T>,
): Promise<T | undefined> {
  try {
    const result = await action();
    steps.push(step(name, "ok"));
    return result;
  } catch (error) {
    if (isRemoteFeatureNotSupported(error)) {
      steps.push(step(name, "skipped", "Não suportado no modo remoto (API V1)"));
      return undefined;
    }
    steps.push(
      step(
        name,
        "failed",
        error instanceof Error ? error.message : String(error),
      ),
    );
    throw error;
  }
}

export async function runFinancialRecordsTest(): Promise<FinancialRecordsTestResult> {
  const ranAt = new Date().toISOString();
  const environment = getDevTestEnvironment();
  const context = await resolveDevTestContext();

  if ("error" in context) {
    return {
      ranAt,
      environment,
      provider: "local",
      success: false,
      message: context.error,
      error: context.error,
    };
  }

  const ts = Date.now();
  const suffix = `dev-${ts}`;
  const steps: DevTestStep[] = [];

  try {
    const wallet = await createWallet({
      name: `Carteira A ${suffix}`,
      icon: "wallet",
      color: themeColorPalette[0],
    });
    steps.push(step("createWalletA", "ok"));

    const walletB = await createWallet({
      name: `Carteira B ${suffix}`,
      icon: "walletPiggyBank",
      color: themeColorPalette[2],
    });
    steps.push(step("createWalletB", "ok"));

    homeStateService.setActiveAccount(walletB.id);
    if (getActiveAccountId() !== walletB.id) {
      throw new Error("activeAccountId não reflete a carteira selecionada");
    }
    steps.push(step("selectWalletB", "ok"));

    const category = await createCategory({
      name: `Categoria Records ${suffix}`,
      icon: "categoryFood",
      color: themeColorPalette[1],
    });
    steps.push(step("createCategory", "ok"));

    const record = await createFinancialRecord({
      walletId: getActiveAccountId(),
      type: "payable",
      description: `Conta teste ${suffix}`,
      categoryId: category.id,
      dueDate: "2026-06-15",
      expectedAmount: 12900,
    });
    steps.push(step("createFinancialRecord", "ok"));

    const updated = await updateFinancialRecord({
      recordId: record.id,
      description: `Conta teste atualizada ${suffix}`,
    });
    steps.push(step("updateFinancialRecord", "ok"));

    const attachment = await runOptionalStep(steps, "createAttachment", () =>
      createAttachment({
        recordId: updated.id,
        kind: "document",
        filename: "boleto.pdf",
        mimeType: "application/pdf",
        size: 1024,
        localPath: `/tmp/fluxor/${suffix}/boleto.pdf`,
        label: "Boleto",
      }),
    );

    const record2 = await createFinancialRecord({
      walletId: wallet.id,
      type: "receivable",
      description: `Destino transferência ${suffix}`,
      categoryId: category.id,
      dueDate: "2026-06-15",
      expectedAmount: 50000,
    });
    steps.push(step("createFinancialRecord (destino)", "ok"));

    const transferLink = await runOptionalStep(
      steps,
      "createTransferLink",
      () =>
        createTransferLink({
          sourceRecordId: updated.id,
          targetRecordId: record2.id,
        }),
    );

    const recurrenceBatch = await runOptionalStep(
      steps,
      "createRecurrenceBatch",
      () =>
        createRecurrenceBatch({
          ruleDescription: `Mensal ${suffix}`,
          startDate: "2026-06-01",
          occurrenceCount: 3,
        }),
    );

    if (context.provider === "remote") {
      steps.push(
        step(
          "appendHistoryEvent",
          "skipped",
          "Histórico gerado automaticamente pelo servidor",
        ),
      );
    } else {
      await appendHistoryEvent({
        recordId: updated.id,
        eventType: "alert_created",
        description: "Alerta configurado",
      });
      steps.push(step("appendHistoryEvent", "ok"));
    }

    const registered = await registerPayment({
      recordId: updated.id,
      effectiveAmount: 12900,
      effectiveDate: "2026-06-15",
    });
    steps.push(step("registerPayment", "ok"));

    const reverted = await revertPayment(registered.id);
    steps.push(step("revertPayment", "ok"));

    const attachments = await listAttachmentsByRecord(updated.id);
    steps.push(step("listAttachmentsByRecord", "ok"));

    const history = await listHistoryByRecord(reverted.id);
    steps.push(step("listHistoryByRecord", "ok"));

    const records = await listFinancialRecords({ walletId: walletB.id });
    steps.push(step("listFinancialRecords", "ok"));

    const recordsOnA = await listFinancialRecords({ walletId: wallet.id });
    const recordsOnB = await listFinancialRecords({ walletId: walletB.id });
    const recordOnB = recordsOnB.some((item) => item.id === reverted.id);
    const recordOnA = recordsOnA.some((item) => item.id === reverted.id);
    if (!recordOnB || recordOnA) {
      throw new Error(
        "Registro associado à carteira errada após seleção de walletB",
      );
    }
    steps.push(step("walletFilterIsolation", "ok"));

    if (attachment) {
      await removeAttachment(attachment.id);
      steps.push(step("removeAttachment", "ok"));
    }

    const attachmentsAfterRemove = await listAttachmentsByRecord(updated.id);

    await getFinancialRecordById(reverted.id);
    steps.push(step("getFinancialRecordById", "ok"));

    if (transferLink) {
      await getTransferLink(transferLink.id);
      steps.push(step("getTransferLink", "ok"));
    }

    if (recurrenceBatch) {
      await getRecurrenceBatch(recurrenceBatch.id);
      steps.push(step("getRecurrenceBatch", "ok"));
    }

    const failedStep = steps.find((item) => item.status === "failed");

    return {
      ranAt,
      environment,
      provider: context.provider,
      remoteBaseUrl: context.remoteBaseUrl,
      success: !failedStep,
      message: failedStep
        ? `Falhou em: ${failedStep.name}${failedStep.message ? ` — ${failedStep.message}` : ""}`
        : "Infraestrutura FinancialRecord exercitada com sucesso",
      steps,
      created: {
        wallet,
        walletB,
        category,
        record: reverted,
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
    if (!steps.some((item) => item.name === "unexpected")) {
      steps.push(
        step(
          "unexpected",
          "failed",
          error instanceof Error ? error.message : String(error),
        ),
      );
    }

    return {
      ranAt,
      environment,
      provider: context.provider,
      remoteBaseUrl: context.remoteBaseUrl,
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
