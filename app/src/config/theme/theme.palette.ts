/** Paleta controlada para carteiras e categorias (V1) — independente do tema ativo. */
export const themeColorPalette = [
  "#38bdf8",
  "#34d399",
  "#fb7185",
  "#fbbf24",
  "#f472b6",
  "#fb923c",
  "#60a5fa",
  "#a78bfa",
] as const;

export type ThemePaletteColor = (typeof themeColorPalette)[number];

/** Cor padrão quando entidade não possui cor definida. */
export const defaultEntityColor: ThemePaletteColor = "#60a5fa";

const themeColorLabelMap: Record<string, string> = {
  "#38bdf8": "Azul",
  "#34d399": "Verde",
  "#fb7185": "Vermelho",
  "#fbbf24": "Amarelo",
  "#f472b6": "Rosa",
  "#fb923c": "Laranja",
  "#60a5fa": "Azul claro",
  "#a78bfa": "Lavanda",
};

export function getThemeColorLabel(color: ThemePaletteColor): string {
  return themeColorLabelMap[color] ?? color;
}

export function isThemePaletteColor(value: string): value is ThemePaletteColor {
  return (themeColorPalette as readonly string[]).includes(value);
}
