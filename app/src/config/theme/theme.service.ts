import {
  defaultThemeId,
  getThemeDefinition,
  isKnownThemeId,
} from "./theme.registry";

import type { ThemeId, ThemeTokens } from "./types";

const STORAGE_KEY = "fluxor:theme";

export function getStoredThemeId(): ThemeId {
  if (typeof window === "undefined") {
    return defaultThemeId;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw || !isKnownThemeId(raw)) {
    return defaultThemeId;
  }

  return raw;
}

export function saveThemeId(themeId: ThemeId): void {
  if (!isKnownThemeId(themeId)) {
    throw new Error(`Tema desconhecido: ${themeId}`);
  }

  window.localStorage.setItem(STORAGE_KEY, themeId);
}

export function getThemeTokens(themeId: ThemeId): ThemeTokens {
  return getThemeDefinition(themeId).tokens;
}

export function applyThemeToDocument(themeId: ThemeId): void {
  const tokens = getThemeTokens(themeId);
  const root = document.documentElement;

  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(`--theme-${name}`, value);
  }

  root.dataset.theme = themeId;
}
