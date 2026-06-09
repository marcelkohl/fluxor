import { resetPersistenceConfig } from "../services";

interface RemoteProviderPendingPageProps {
  remoteBaseUrl?: string;
}

export function RemoteProviderPendingPage({
  remoteBaseUrl,
}: RemoteProviderPendingPageProps) {
  function handleReconfigure() {
    resetPersistenceConfig();
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold text-text-primary">
          Servidor remoto
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Provider remoto ainda não implementado.
        </p>
        {remoteBaseUrl ? (
          <p className="mt-2 break-all text-xs text-muted">{remoteBaseUrl}</p>
        ) : null}
        <button
          type="button"
          onClick={handleReconfigure}
          className="mt-6 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary"
        >
          Reconfigurar fonte de dados
        </button>
      </div>
    </div>
  );
}
