export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  primarySoft: string;
  primaryForeground: string;
  /** Links, hovers, foco e destaques interativos (distinto do primary em muitos temas). */
  link: string;
  linkSoft: string;
  income: string;
  expense: string;
  warning: string;
  muted: string;
  actionGradient: string;
}

export type ThemeTokenName = keyof ThemeTokens;

/** Identificador do tema — derivado do campo `id` de cada manifest. */
export type ThemeId = string;

export interface ThemePreview {
  background?: string;
  accent?: string;
}

/**
 * Contrato de cada pasta em `themes/<id>/manifest.json`.
 * Para adicionar um tema: crie a pasta e o manifest — sem alterar código da aplicação.
 */
export interface ThemeManifest {
  id: string;
  label: string;
  order?: number;
  default?: boolean;
  preview?: ThemePreview;
  tokens: ThemeTokens;
}

export type ThemeDefinition = ThemeManifest;
