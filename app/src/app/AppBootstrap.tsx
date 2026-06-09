import { useEffect, useState } from "react";

import { AppRouter } from "@/routes";
import { initializeDatabase } from "@/features/database";
import {
  getPersistenceConfig,
  PersistenceSetupPage,
  type PersistenceConfig,
} from "@/features/persistence-setup";

type BootstrapPhase = "setup" | "initializing" | "ready";

export function AppBootstrap() {
  const [config, setConfig] = useState<PersistenceConfig | null>(() =>
    getPersistenceConfig(),
  );
  const [phase, setPhase] = useState<BootstrapPhase>(() => {
    const initial = getPersistenceConfig();
    if (!initial) {
      return "setup";
    }
    if (initial.mode === "remote") {
      return "ready";
    }
    return "initializing";
  });

  useEffect(() => {
    if (!config || config.mode !== "local") {
      return;
    }

    let cancelled = false;

    void initializeDatabase()
      .then(() => {
        if (!cancelled) {
          setPhase("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhase("ready");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (phase === "setup") {
    return (
      <PersistenceSetupPage
        onConfigured={(nextConfig) => {
          setConfig(nextConfig);
          if (nextConfig.mode === "remote") {
            setPhase("ready");
            return;
          }
          setPhase("initializing");
        }}
      />
    );
  }

  if (phase === "initializing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-text-secondary">Inicializando…</p>
      </div>
    );
  }

  return <AppRouter />;
}
