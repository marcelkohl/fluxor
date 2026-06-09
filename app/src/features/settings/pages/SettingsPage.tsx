import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { APP_NAME, APP_VERSION } from "@/config/app-meta";
import { ThemeIcon } from "@/config/theme";
import { DatabaseDevPanel } from "@/features/database/dev";
import { DataSourceSettingsSection } from "@/features/persistence-setup";
import { SettingsMenuItem } from "@/features/settings/components/SettingsMenuItem";
import { ThemeSettingsSection } from "@/features/settings/components/ThemeSettingsSection";
import {
  SETTINGS_DEV_ITEM,
  SETTINGS_MENU_ITEMS,
  type SettingsMenuEntry,
} from "@/features/settings/settings.constants";

type SettingsView = "index" | "theme" | "data-source" | "dev";

const SUBVIEW_TITLES: Record<Exclude<SettingsView, "index">, string> = {
  theme: "Tema",
  "data-source": "Fonte de Dados",
  dev: "Diagnóstico DEV",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<SettingsView>("index");
  const isDev = import.meta.env.DEV;

  function handleBack() {
    if (view !== "index") {
      setView("index");
      return;
    }
    navigate("/");
  }

  function handleItemClick(item: SettingsMenuEntry) {
    if (!item.enabled) {
      return;
    }

    if (item.id === "theme") {
      setView("theme");
      return;
    }

    if (item.id === "data-source") {
      setView("data-source");
      return;
    }

    if (item.id === "wallets") {
      navigate("/settings/wallets");
      return;
    }

    if (item.id === "categories") {
      navigate("/settings/categories");
      return;
    }

    if (item.id === "payees") {
      navigate("/settings/payees");
      return;
    }

    if (item.id === "dev") {
      setView("dev");
    }
  }

  const headerTitle = view === "index" ? "Configurações" : SUBVIEW_TITLES[view];

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>
        <h1 className="text-base font-semibold text-text-primary">{headerTitle}</h1>
      </header>

      {view === "index" ? (
        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Configurações">
          <div className="divide-y divide-border/50">
            {SETTINGS_MENU_ITEMS.map((item) => (
              <SettingsMenuItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                enabled={item.enabled}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>

          {isDev ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" aria-hidden />
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary">
                    Ferramentas de Desenvolvimento
                  </span>
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    DEV
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" aria-hidden />
              </div>

              <SettingsMenuItem
                title={SETTINGS_DEV_ITEM.title}
                subtitle={SETTINGS_DEV_ITEM.subtitle}
                icon={SETTINGS_DEV_ITEM.icon}
                enabled={SETTINGS_DEV_ITEM.enabled}
                onClick={() => handleItemClick(SETTINGS_DEV_ITEM)}
              />
            </div>
          ) : null}

          <footer className="mt-8 space-y-1 pb-4 text-center">
            <p className="text-xs text-text-secondary">
              Índice administrativo — cada área terá tela dedicada em etapas
              futuras.
            </p>
            <p className="text-xs text-muted">
              {APP_NAME} v{APP_VERSION}
            </p>
          </footer>
        </nav>
      ) : null}

      {view === "theme" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ThemeSettingsSection />
        </div>
      ) : null}

      {view === "data-source" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <DataSourceSettingsSection />
        </div>
      ) : null}

      {view === "dev" ? (
        <div className="flex-1 overflow-y-auto">
          <DatabaseDevPanel />
        </div>
      ) : null}
    </div>
  );
}
