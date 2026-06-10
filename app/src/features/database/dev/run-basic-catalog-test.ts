import { themeColorPalette } from "@/config/theme/theme.palette";
import { createCategory, createCategoryQuick } from "@/features/categories";
import { listCategories } from "@/features/categories/application/category.use-cases";
import {
  getDevTestEnvironment,
  isRemoteFeatureNotSupported,
  resolveDevTestContext,
  type DevTestStep,
} from "@/features/database/dev/dev-test-context";
import {
  createPayee,
  createPayeeDocument,
  createPayeePaymentMethod,
  createPayeeQuick,
} from "@/features/payees";
import { listPayees } from "@/features/payees/application/payee.use-cases";
import { createWallet } from "@/features/wallets";
import { listWallets } from "@/features/wallets/application/wallet.use-cases";

import type { DevTestBaseResult } from "./dev-test-context";

export interface BasicCatalogTestResult extends DevTestBaseResult {
  created?: {
    wallet: unknown;
    category: unknown;
    categoryQuick: unknown;
    payee: unknown;
    payeeQuick: unknown;
    payeeDocument?: unknown;
    payeePaymentMethod?: unknown;
  };
  lists?: {
    wallets: unknown[];
    categories: unknown[];
    payees: unknown[];
  };
}

function step(
  name: string,
  status: DevTestStep["status"],
  message?: string,
): DevTestStep {
  return { name, status, message };
}

export async function runBasicCatalogTest(): Promise<BasicCatalogTestResult> {
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
      name: `Carteira ${suffix}`,
      icon: "wallet",
      color: themeColorPalette[0],
    });
    steps.push(step("createWallet", "ok"));

    const category = await createCategory({
      name: `Categoria ${suffix}`,
      icon: "categoryFood",
      color: themeColorPalette[1],
      description: "Teste DEV",
    });
    steps.push(step("createCategory", "ok"));

    const categoryQuick = await createCategoryQuick({
      name: `Categoria Quick ${suffix}`,
    });
    steps.push(step("createCategoryQuick", "ok"));

    const payee = await createPayee({
      name: `Favorecido ${suffix}`,
      notes: "Teste DEV",
    });
    steps.push(step("createPayee", "ok"));

    const payeeQuick = await createPayeeQuick({
      name: `Favorecido Quick ${suffix}`,
    });
    steps.push(step("createPayeeQuick", "ok"));

    let payeeDocument: unknown;
    try {
      payeeDocument = await createPayeeDocument({
        payeeId: payee.id,
        type: "CPF",
        value: `000.000.000-${String(ts).slice(-2)}`,
      });
      steps.push(step("createPayeeDocument", "ok"));
    } catch (error) {
      if (isRemoteFeatureNotSupported(error)) {
        steps.push(
          step(
            "createPayeeDocument",
            "skipped",
            "Não suportado no modo remoto (API V1)",
          ),
        );
      } else {
        throw error;
      }
    }

    let payeePaymentMethod: unknown;
    try {
      payeePaymentMethod = await createPayeePaymentMethod({
        payeeId: payee.id,
        type: "PIX",
        value: `dev-${suffix}@fluxor.test`,
      });
      steps.push(step("createPayeePaymentMethod", "ok"));
    } catch (error) {
      if (isRemoteFeatureNotSupported(error)) {
        steps.push(
          step(
            "createPayeePaymentMethod",
            "skipped",
            "Não suportado no modo remoto (API V1)",
          ),
        );
      } else {
        throw error;
      }
    }

    const wallets = await listWallets();
    const categories = await listCategories();
    const payees = await listPayees();
    steps.push(step("listWallets", "ok"));
    steps.push(step("listCategories", "ok"));
    steps.push(step("listPayees", "ok"));

    const failedStep = steps.find((item) => item.status === "failed");

    return {
      ranAt,
      environment,
      provider: context.provider,
      remoteBaseUrl: context.remoteBaseUrl,
      success: !failedStep,
      message: failedStep
        ? `Falhou em: ${failedStep.name}`
        : "Cadastros básicos criados e listados com sucesso",
      steps,
      created: {
        wallet,
        category,
        categoryQuick,
        payee,
        payeeQuick,
        payeeDocument,
        payeePaymentMethod,
      },
      lists: {
        wallets,
        categories,
        payees,
      },
    };
  } catch (error) {
    steps.push(
      step(
        "unexpected",
        "failed",
        error instanceof Error ? error.message : String(error),
      ),
    );

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
