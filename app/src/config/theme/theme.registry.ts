import type {
  ThemeDefinition,
  ThemeManifest,
  ThemeTokenName,
  ThemeTokens,
} from "./types";

const REQUIRED_TOKEN_KEYS: ThemeTokenName[] = [
  "background",
  "surface",
  "surfaceSoft",
  "border",
  "textPrimary",
  "textSecondary",
  "primary",
  "primarySoft",
  "primaryForeground",
  "link",
  "linkSoft",
  "income",
  "expense",
  "warning",
  "muted",
  "actionGradient",
];

const manifestModules = import.meta.glob<ThemeManifest>("./themes/*/manifest.json", {
  eager: true,
  import: "default",
});

function extractFolderId(manifestPath: string): string | null {
  const match = manifestPath.match(/\/themes\/([^/]+)\/manifest\.json$/);
  return match?.[1] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTokens(raw: unknown, themeId: string): ThemeTokens {
  if (!isRecord(raw)) {
    throw new Error(`Tema "${themeId}": campo "tokens" inválido`);
  }

  const tokens = {} as ThemeTokens;

  for (const key of REQUIRED_TOKEN_KEYS) {
    const value = raw[key];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Tema "${themeId}": token "${key}" ausente ou inválido`);
    }
    tokens[key] = value;
  }

  return tokens;
}

function parseManifest(manifestPath: string, raw: unknown): ThemeDefinition {
  if (!isRecord(raw)) {
    throw new Error(`Manifesto inválido em ${manifestPath}`);
  }

  const folderId = extractFolderId(manifestPath);
  const id = raw.id;
  const label = raw.label;

  if (typeof id !== "string" || !id.trim()) {
    throw new Error(`Manifesto em ${manifestPath}: campo "id" obrigatório`);
  }

  if (typeof label !== "string" || !label.trim()) {
    throw new Error(`Tema "${id}": campo "label" obrigatório`);
  }

  if (folderId && folderId !== id) {
    throw new Error(
      `Tema "${id}": pasta "${folderId}" deve coincidir com o campo "id" do manifest`,
    );
  }

  const tokens = parseTokens(raw.tokens, id);

  const preview =
    isRecord(raw.preview) &&
    (typeof raw.preview.background === "string" ||
      typeof raw.preview.accent === "string")
      ? {
          ...(typeof raw.preview.background === "string"
            ? { background: raw.preview.background }
            : {}),
          ...(typeof raw.preview.accent === "string"
            ? { accent: raw.preview.accent }
            : {}),
        }
      : undefined;

  return {
    id,
    label,
    order: typeof raw.order === "number" ? raw.order : undefined,
    default: raw.default === true,
    preview,
    tokens,
  };
}

function loadThemeCatalog(): ThemeDefinition[] {
  const themes = Object.entries(manifestModules).map(([path, manifest]) =>
    parseManifest(path, manifest),
  );

  const ids = new Set<string>();
  for (const theme of themes) {
    if (ids.has(theme.id)) {
      throw new Error(`Tema duplicado: "${theme.id}"`);
    }
    ids.add(theme.id);
  }

  return themes.sort((left, right) => {
    const orderDiff = (left.order ?? 999) - (right.order ?? 999);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return left.label.localeCompare(right.label, "pt-BR");
  });
}

export const themeCatalog = loadThemeCatalog();

export const themeDefinitions: Record<string, ThemeDefinition> = Object.fromEntries(
  themeCatalog.map((theme) => [theme.id, theme]),
);

export const knownThemeIds = themeCatalog.map((theme) => theme.id);

const explicitDefault = themeCatalog.find((theme) => theme.default);
export const defaultThemeId = explicitDefault?.id ?? themeCatalog[0]?.id ?? "dark";

export function isKnownThemeId(value: string): boolean {
  return value in themeDefinitions;
}

export function getThemeDefinition(themeId: string): ThemeDefinition {
  return themeDefinitions[themeId] ?? themeDefinitions[defaultThemeId];
}
