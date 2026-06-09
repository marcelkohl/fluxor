const svgModules = import.meta.glob<string>("../../assets/icons/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

function extractIconName(modulePath: string): string | null {
  const match = modulePath.match(/\/icons\/([^/]+)\.svg$/);
  return match?.[1] ?? null;
}

function buildIconRegistry(): Record<string, string> {
  const registry: Record<string, string> = {};

  for (const [modulePath, svg] of Object.entries(svgModules)) {
    const name = extractIconName(modulePath);
    if (!name) {
      continue;
    }

    if (registry[name]) {
      throw new Error(`Ícone duplicado: "${name}"`);
    }

    registry[name] = svg;
  }

  if (Object.keys(registry).length === 0) {
    throw new Error("Nenhum ícone encontrado em src/assets/icons/");
  }

  return registry;
}

/** SVG raw por nome de arquivo (sem extensão). */
export const themeIcons: Readonly<Record<string, string>> = buildIconRegistry();

/** Nomes disponíveis, ordenados alfabeticamente. */
export const knownIconNames: readonly string[] = Object.keys(themeIcons).sort();

/** Identificador de ícone — corresponde ao nome do arquivo `.svg`. */
export type ThemeIconName = string;

export function isKnownIcon(name: string): name is ThemeIconName {
  return Object.prototype.hasOwnProperty.call(themeIcons, name);
}

export function getThemeIconSvg(name: string): string | undefined {
  return themeIcons[name];
}

/** Alias legado. */
export function getThemeIcon(name: string): string | undefined {
  return getThemeIconSvg(name);
}
