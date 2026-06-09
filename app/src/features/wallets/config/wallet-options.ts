import type { ThemeIconName } from "@/config/theme";
import {
  themeColorPalette,
  type ThemePaletteColor,
} from "@/config/theme/theme.palette";

/** Par [id, label PT] — ordem define a exibição no picker. */
const WALLET_ICON_ENTRIES = [
  // Carteira e contas
  ["wallet", "Carteira"],
  ["walletBank", "Banco"],
  ["walletCreditCard", "Cartão de crédito"],
  ["walletCash", "Dinheiro"],
  ["walletPiggyBank", "Cofrinho"],
  ["walletSafe", "Cofre"],
  ["walletInvestment", "Investimentos"],
  ["walletStocks", "Ações"],
  ["walletCrypto", "Criptomoedas"],
  ["walletHome", "Casa"],
  ["walletCar", "Carro"],
  ["walletTravel", "Viagem"],
  ["walletBusiness", "Empresa"],
  ["walletBriefcase", "Maleta"],
  // Genéricos
  ["user", "Pessoa"],
  ["users", "Pessoas"],
  ["tag", "Etiqueta"],
  ["calendar", "Calendário"],
  // Legado — mantém edição de carteiras já salvas com ícones antigos
  ["categoryIncome", "Receita"],
  ["categoryFood", "Alimentação"],
  ["categoryHealth", "Saúde"],
  ["categoryUtilities", "Utilidades"],
  ["categoryServices", "Serviços"],
  ["widgets", "Widgets"],
  ["upload", "Upload"],
] as const satisfies readonly (readonly [ThemeIconName, string])[];

/** Ícones permitidos para carteiras (lista controlada). */
export const walletIconOptions = WALLET_ICON_ENTRIES.map(
  ([id]) => id,
) as readonly ThemeIconName[];

export type WalletIconOption = (typeof WALLET_ICON_ENTRIES)[number][0];

export const walletIconLabels: Record<WalletIconOption, string> =
  Object.fromEntries(WALLET_ICON_ENTRIES) as Record<WalletIconOption, string>;

export const DEFAULT_WALLET_ICON: WalletIconOption = "wallet";
export const DEFAULT_WALLET_COLOR: ThemePaletteColor = themeColorPalette[0];

export { themeColorPalette as walletColorOptions };
