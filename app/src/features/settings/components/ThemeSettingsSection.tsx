import { themeCatalog, useTheme } from "@/config/theme";

import type { ThemeDefinition } from "@/config/theme";

export function ThemeSettingsSection() {
  const { themeId, setThemeId } = useTheme();

  return (
    <section aria-label="Seleção de tema">
      <p className="text-xs text-text-secondary">
        Escolha a aparência visual do aplicativo.
      </p>

      <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Tema">
        {themeCatalog.map((theme) => {
          const isActive = themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setThemeId(theme.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? "border-link bg-link-soft"
                  : "border-border hover:bg-surface-soft"
              }`}
            >
              <ThemePreviewSwatch theme={theme} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">
                  {theme.label}
                </span>
              </span>
              {isActive ? (
                <span className="text-xs font-semibold text-link">Ativo</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ThemePreviewSwatch({ theme }: { theme: ThemeDefinition }) {
  const { background, surface, primary, income, expense } = theme.tokens;
  const stripeColors = [surface, primary, income, expense];

  return (
    <span
      className="box-border flex h-8 w-8 shrink-0 rounded-full border border-border p-px"
      aria-hidden
      title={`${background} · ${surface} · ${primary} · ${income} · ${expense}`}
    >
      <span
        className="flex h-full w-full overflow-hidden rounded-full border-2"
        style={{ borderColor: background }}
      >
        {stripeColors.map((color, index) => (
          <span
            key={index}
            className="h-full flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
    </span>
  );
}
