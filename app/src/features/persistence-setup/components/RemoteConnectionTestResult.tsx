import type { RemoteServerTestResult } from "../services/test-remote-server-connection";

interface RemoteConnectionTestResultProps {
  result: RemoteServerTestResult | null;
  testing?: boolean;
}

export function RemoteConnectionTestResult({
  result,
  testing = false,
}: RemoteConnectionTestResultProps) {
  if (testing) {
    return (
      <p className="text-sm text-text-secondary">Testando conexão…</p>
    );
  }

  if (!result) {
    return null;
  }

  const isSuccess = result.outcome === "success";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm whitespace-pre-line ${
        isSuccess
          ? "border-income/40 bg-income/10 text-text-primary"
          : "border-expense/40 bg-expense/10 text-text-primary"
      }`}
    >
      {result.message}
      {result.normalizedUrl ? (
        <p className="mt-2 break-all text-xs text-muted">
          URL normalizada: {result.normalizedUrl}
        </p>
      ) : null}
    </div>
  );
}
