import { defaultThemeId, themeDefinitions } from "./theme.registry";

import type { ThemeTokenName, ThemeTokens } from "./types";

/** Tokens do tema padrão — valor estático para imports legados. */
export const themeTokens: ThemeTokens = themeDefinitions[defaultThemeId].tokens;

export type { ThemeTokenName, ThemeTokens };

/** Retorna referência CSS var para uso inline ou em estilos. */
export function themeVar(name: ThemeTokenName): string {
  return `var(--theme-${name})`;
}

/** Converte camelCase para kebab-case (ex.: textPrimary → text-primary). */
export function themeVarName(name: ThemeTokenName): string {
  return name.replace(/([A-Z])/g, "-$1").toLowerCase();
}
