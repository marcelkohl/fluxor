import { getPersistenceModeLabel } from "../application";
import { getPersistenceConfig, resetPersistenceConfig } from "../services";

export function DataSourceSettingsSection() {
  const config = getPersistenceConfig();

  if (!config) {
    return (
      <section aria-label="Fonte de dados">
        <p className="text-sm text-text-secondary">
          Nenhuma fonte de dados configurada.
        </p>
      </section>
    );
  }

  function handleReconfigure() {
    resetPersistenceConfig();
    window.location.reload();
  }

  return (
    <section aria-label="Fonte de dados">
      <p className="text-xs text-text-secondary">
        Modo atual:{" "}
        <span className="font-medium text-text-primary">
          {getPersistenceModeLabel(config.mode)}
        </span>
      </p>
      {config.mode === "remote" && config.remoteBaseUrl ? (
        <p className="mt-1 break-all text-xs text-muted">{config.remoteBaseUrl}</p>
      ) : null}
      <button
        type="button"
        onClick={handleReconfigure}
        className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft"
      >
        Reconfigurar fonte de dados
      </button>
    </section>
  );
}
