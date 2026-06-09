import type {
  CreateFinancialRecordRequest,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";
import { CategoryNotFoundError } from "../../categories/errors/category-not-found.error.js";
import { PayeeNotFoundError } from "../../payees/errors/payee-not-found.error.js";
import type { PersistenceProvider } from "../../persistence/providers/persistence-provider.types.js";
import { isValidIsoDate } from "../../shared/datetime.js";
import { WalletNotFoundError } from "../../wallets/errors/wallet-not-found.error.js";
import { FinancialRecordValidationError } from "../errors/financial-record-validation.error.js";

function validateAmount(
  amount: number | undefined,
  fieldName: string,
): void {
  if (amount === undefined) {
    return;
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new FinancialRecordValidationError(
      "invalid_amount",
      `${fieldName} must be a positive integer`,
    );
  }
}

function validateDate(value: string | undefined, fieldName: string): void {
  if (value === undefined) {
    return;
  }

  if (!isValidIsoDate(value)) {
    throw new FinancialRecordValidationError(
      "invalid_date",
      `${fieldName} must be a valid ISO date (YYYY-MM-DD)`,
    );
  }
}

async function validateWalletId(
  persistence: PersistenceProvider,
  walletId: string | undefined,
): Promise<void> {
  if (!walletId) {
    return;
  }

  const wallet = await persistence.wallets.getById(walletId);
  if (!wallet) {
    throw new WalletNotFoundError(walletId);
  }
}

async function validateCategoryId(
  persistence: PersistenceProvider,
  categoryId: string | undefined,
): Promise<void> {
  if (!categoryId) {
    return;
  }

  const category = await persistence.categories.getById(categoryId);
  if (!category) {
    throw new CategoryNotFoundError(categoryId);
  }
}

async function validatePayeeId(
  persistence: PersistenceProvider,
  payeeId: string | null | undefined,
): Promise<void> {
  if (payeeId === undefined || payeeId === null) {
    return;
  }

  const payee = await persistence.payees.getById(payeeId);
  if (!payee) {
    throw new PayeeNotFoundError(payeeId);
  }
}

export async function validateCreateFinancialRecordInput(
  persistence: PersistenceProvider,
  data: CreateFinancialRecordRequest,
): Promise<void> {
  validateDate(data.dueDate, "dueDate");
  validateAmount(data.expectedAmount, "expectedAmount");
  validateAmount(data.effectiveAmount ?? undefined, "effectiveAmount");
  validateDate(data.effectiveDate ?? undefined, "effectiveDate");

  await validateWalletId(persistence, data.walletId);
  await validateCategoryId(persistence, data.categoryId);
  await validatePayeeId(persistence, data.payeeId);
}

export async function validateUpdateFinancialRecordInput(
  persistence: PersistenceProvider,
  data: UpdateFinancialRecordRequest,
): Promise<void> {
  validateDate(data.dueDate, "dueDate");
  validateAmount(data.expectedAmount, "expectedAmount");

  await validateCategoryId(persistence, data.categoryId);
  await validatePayeeId(persistence, data.payeeId);
}
