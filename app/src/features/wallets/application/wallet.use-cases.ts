import { isKnownIcon, type ThemeIconName } from "@/config/theme/icon.registry";
import { isThemePaletteColor } from "@/config/theme/theme.palette";
import { NotFoundError, ValidationError } from "@/features/database";
import {
  requireAtLeastOneField,
  requireNonEmpty,
} from "@/features/database/utils";
import { resolvePersistence } from "@/features/persistence";

import type { CreateWalletData, UpdateWalletData, Wallet } from "../domain";

function validateIcon(icon: string): ThemeIconName {
  if (!isKnownIcon(icon)) {
    throw new ValidationError("Ícone inválido");
  }
  return icon as ThemeIconName;
}

function validateColor(color: string): string {
  if (!isThemePaletteColor(color)) {
    throw new ValidationError("Cor inválida");
  }
  return color;
}

export interface CreateWalletInput {
  name: string;
  icon: string;
  color: string;
  notes?: string | null;
  isDefault?: boolean;
}

export async function listWallets(): Promise<Wallet[]> {
  const { wallets } = await resolvePersistence();
  return wallets.listActive();
}

export async function createWallet(input: CreateWalletInput): Promise<Wallet> {
  const { wallets } = await resolvePersistence();

  const data: CreateWalletData = {
    name: requireNonEmpty(input.name, "Nome"),
    icon: validateIcon(input.icon),
    color: validateColor(input.color),
    notes: input.notes ?? null,
    isDefault: input.isDefault ?? false,
  };

  return wallets.create(data);
}

export interface UpdateWalletInput {
  walletId: string;
  name?: string;
  icon?: string;
  color?: string;
  notes?: string | null;
}

export async function updateWallet(input: UpdateWalletInput): Promise<Wallet> {
  const { wallets } = await resolvePersistence();

  requireAtLeastOneField(
    {
      name: input.name,
      icon: input.icon,
      color: input.color,
      notes: input.notes,
    },
    "Carteira",
  );

  const existing = await wallets.getById(input.walletId);
  if (!existing) {
    throw new NotFoundError("Carteira não encontrada");
  }

  const data: UpdateWalletData = {};
  if (input.name !== undefined) {
    data.name = requireNonEmpty(input.name, "Nome");
  }
  if (input.icon !== undefined) {
    data.icon = validateIcon(input.icon);
  }
  if (input.color !== undefined) {
    data.color = validateColor(input.color);
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
  }

  return wallets.update(input.walletId, data);
}

export async function archiveWallet(walletId: string): Promise<Wallet> {
  const { wallets } = await resolvePersistence();

  const existing = await wallets.getById(walletId);
  if (!existing) {
    throw new NotFoundError("Carteira não encontrada");
  }
  if (existing.isArchived) {
    throw new ValidationError("Carteira já está arquivada");
  }

  return wallets.archive(walletId);
}

export async function setDefaultWallet(walletId: string): Promise<Wallet> {
  const { wallets } = await resolvePersistence();

  const existing = await wallets.getById(walletId);
  if (!existing) {
    throw new NotFoundError("Carteira não encontrada");
  }
  if (existing.isArchived) {
    throw new ValidationError("Carteira arquivada não pode ser padrão");
  }

  return wallets.setDefault(walletId);
}
