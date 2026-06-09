export interface ThemeAssetRef {
  /** Caminho relativo ou absoluto do asset. */
  path: string;
  /** Fallback enquanto o asset real não existir. */
  fallback?: string;
}

export const themeAssets = {
  logo: {
    path: "/theme/assets/logo.svg",
    fallback: undefined,
  },
  appIcon: {
    path: "/theme/assets/app-icon.png",
    fallback: "/favicon.svg",
  },
  /** Legado — ícones vivem em src/assets/icons/ (bundled via icon.registry). */
  categoryIconPathBase: "/theme/assets/categories",
  themeAssetPathBase: "/theme/assets",
} as const satisfies Record<string, ThemeAssetRef | string>;

export type ThemeAssetKey = "logo" | "appIcon";

/** Resolve caminho completo de um asset dentro da pasta base do tema. */
export function resolveThemeAsset(relativePath: string): string {
  const base = themeAssets.themeAssetPathBase as string;
  return `${base}/${relativePath}`.replace(/\/+/g, "/");
}

/** Resolve caminho futuro de ícone PNG por categoria (ex.: health.png). */
export function resolveCategoryIconAsset(categoryKey: string): string {
  const base = themeAssets.categoryIconPathBase as string;
  return `${base}/${categoryKey}.png`;
}

/** Retorna path do asset ou fallback, se definido. */
export function getThemeAsset(key: ThemeAssetKey): string {
  const asset = themeAssets[key] as ThemeAssetRef;
  return asset.fallback ?? asset.path;
}

/** Indica se um ícone deve ser carregado como PNG em vez de SVG/emoji do registry. */
export function shouldUseCategoryAsset(_categoryKey: string): boolean {
  // Ativado quando os PNGs estiverem disponíveis em public/theme/assets/categories/
  return false;
}
