import { isTauri } from "@tauri-apps/api/core";

import { themeColorPalette } from "@/config/theme/theme.palette";
import { createCategory, createCategoryQuick } from "@/features/categories";
import { CategoryRepository } from "@/features/categories/repositories";
import {
  ensureDatabaseReady,
  getDatabaseService,
  initializeDatabase,
} from "@/features/database";
import {
  createPayee,
  createPayeeDocument,
  createPayeePaymentMethod,
  createPayeeQuick,
} from "@/features/payees";
import { PayeeRepository } from "@/features/payees/repositories";
import { createWallet } from "@/features/wallets";
import { WalletRepository } from "@/features/wallets/repositories";

export interface BasicCatalogTestResult {
  ranAt: string;
  environment: "tauri" | "browser";
  success: boolean;
  message?: string;
  created?: {
    wallet: unknown;
    category: unknown;
    categoryQuick: unknown;
    payee: unknown;
    payeeQuick: unknown;
    payeeDocument: unknown;
    payeePaymentMethod: unknown;
  };
  lists?: {
    wallets: unknown[];
    categories: unknown[];
    payees: unknown[];
  };
  error?: string;
}

export async function runBasicCatalogTest(): Promise<BasicCatalogTestResult> {
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

    const db = await ensureDatabaseReady();
    const walletRepo = new WalletRepository(db);
    const categoryRepo = new CategoryRepository(db);
    const payeeRepo = new PayeeRepository(db);

    const wallet = await createWallet({
      name: `Carteira ${suffix}`,
      icon: "wallet",
      color: themeColorPalette[0],
    });

    const category = await createCategory({
      name: `Categoria ${suffix}`,
      icon: "categoryFood",
      color: themeColorPalette[1],
      description: "Teste DEV",
    });

    const categoryQuick = await createCategoryQuick({
      name: `Categoria Quick ${suffix}`,
    });

    const payee = await createPayee({
      name: `Favorecido ${suffix}`,
      notes: "Teste DEV",
    });

    const payeeQuick = await createPayeeQuick({
      name: `Favorecido Quick ${suffix}`,
    });

    const payeeDocument = await createPayeeDocument({
      payeeId: payee.id,
      type: "CPF",
      value: `000.000.000-${String(ts).slice(-2)}`,
    });

    const payeePaymentMethod = await createPayeePaymentMethod({
      payeeId: payee.id,
      type: "PIX",
      value: `dev-${suffix}@fluxor.test`,
    });

    const wallets = await walletRepo.listActive();
    const categories = await categoryRepo.listActive();
    const payees = await payeeRepo.listActive();

    return {
      ranAt,
      environment: "tauri",
      success: true,
      message: "Cadastros básicos criados e listados com sucesso",
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
    return {
      ranAt,
      environment: "tauri",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
