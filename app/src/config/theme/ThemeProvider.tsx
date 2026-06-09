import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getThemeDefinition } from "./theme.registry";
import {
  applyThemeToDocument,
  getStoredThemeId,
  getThemeTokens,
  saveThemeId,
} from "./theme.service";

import type { ThemeId, ThemeTokens } from "./types";

interface ThemeContextValue {
  themeId: ThemeId;
  themeLabel: string;
  tokens: ThemeTokens;
  setThemeId: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => getStoredThemeId());

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    applyThemeToDocument(nextThemeId);
    saveThemeId(nextThemeId);
    setThemeIdState(nextThemeId);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      themeLabel: getThemeDefinition(themeId).label,
      tokens: getThemeTokens(themeId),
      setThemeId,
    }),
    [themeId, setThemeId],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}
