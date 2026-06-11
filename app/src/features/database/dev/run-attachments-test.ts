import { themeColorPalette } from "@/config/theme/theme.palette";
import { createCategory } from "@/features/categories";
import {
  getDevTestEnvironment,
  resolveDevTestContext,
  type DevTestStep,
} from "@/features/database/dev/dev-test-context";
import {
  createAttachment,
  createFinancialRecord,
  getAttachmentById,
  listAttachmentsByRecord,
  removeAttachment,
} from "@/features/financial-records";
import { createWallet } from "@/features/wallets";

import type { DevTestBaseResult } from "./dev-test-context";

export interface AttachmentsTestResult extends DevTestBaseResult {
  created?: {
    record: unknown;
    attachment?: unknown;
    attachmentAfterRemove?: unknown;
  };
  lists?: {
    attachmentsBeforeRemove: unknown[];
    attachmentsAfterRemove: unknown[];
  };
}

function step(
  name: string,
  status: DevTestStep["status"],
  message?: string,
): DevTestStep {
  return { name, status, message };
}

export async function runAttachmentsTest(): Promise<AttachmentsTestResult> {
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
      name: `Carteira Attachments ${suffix}`,
      icon: "wallet",
      color: themeColorPalette[0],
    });

    const category = await createCategory({
      name: `Categoria Attachments ${suffix}`,
      icon: "categoryFood",
      color: themeColorPalette[1],
    });

    const record = await createFinancialRecord({
      walletId: wallet.id,
      type: "payable",
      description: `Conta attachments ${suffix}`,
      categoryId: category.id,
      dueDate: "2026-07-15",
      expectedAmount: 15000,
    });
    steps.push(step("createFinancialRecord", "ok"));

    const attachment = await createAttachment({
      recordId: record.id,
      kind: "document",
      filename: "iptu-julho.pdf",
      mimeType: "application/pdf",
      size: 245760,
      localPath: `/pessoal/2026/julho/iptu - ${suffix}.pdf`,
      label: "Boleto",
    });
    steps.push(step("createAttachment", "ok"));

    const attachmentsBeforeRemove = await listAttachmentsByRecord(record.id);
    if (!attachmentsBeforeRemove.some((item) => item.id === attachment.id)) {
      throw new Error("Anexo criado não aparece na listagem do registro");
    }
    steps.push(step("listAttachmentsByRecord", "ok"));

    const fetched = await getAttachmentById(attachment.id);
    if (fetched.id !== attachment.id || fetched.recordId !== record.id) {
      throw new Error("getAttachmentById retornou dados inconsistentes");
    }
    steps.push(step("getAttachmentById", "ok"));

    const removed = await removeAttachment(attachment.id);
    steps.push(step("removeAttachment", "ok"));

    const attachmentsAfterRemove = await listAttachmentsByRecord(record.id);
    if (attachmentsAfterRemove.some((item) => item.id === attachment.id)) {
      throw new Error("Anexo removido ainda aparece na listagem");
    }
    steps.push(step("listAttachmentsByRecord (após remover)", "ok"));

    const failedStep = steps.find((item) => item.status === "failed");

    return {
      ranAt,
      environment,
      provider: context.provider,
      remoteBaseUrl: context.remoteBaseUrl,
      success: !failedStep,
      message: failedStep
        ? `Falhou em: ${failedStep.name}${failedStep.message ? ` — ${failedStep.message}` : ""}`
        : "Fluxo de attachments exercitado com sucesso",
      steps,
      created: {
        record,
        attachment,
        attachmentAfterRemove: removed,
      },
      lists: {
        attachmentsBeforeRemove,
        attachmentsAfterRemove,
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
