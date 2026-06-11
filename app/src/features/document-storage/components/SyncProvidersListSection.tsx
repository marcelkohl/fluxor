import { useMemo } from "react";

import { SettingsMenuItem } from "@/features/settings/components/SettingsMenuItem";
import { StorageProviderRegistry } from "../registry/storage-provider-registry";

interface SyncProvidersListSectionProps {
  onSelectProvider: (providerId: string) => void;
}

function buildProviderSubtitle(
  statusLabel: string,
  lastSyncLabel: string,
  enabled: boolean,
): string {
  if (!enabled) {
    return statusLabel;
  }

  return `${statusLabel} · Último sync: ${lastSyncLabel}`;
}

export function SyncProvidersListSection({
  onSelectProvider,
}: SyncProvidersListSectionProps) {
  const providers = useMemo(() => StorageProviderRegistry.list(), []);

  function handleProviderClick(providerId: string) {
    const provider = StorageProviderRegistry.getById(providerId);
    if (!provider?.enabled || !provider.hasConfiguration) {
      return;
    }

    onSelectProvider(providerId);
  }

  return (
    <section aria-label="Providers de sync">
      <div className="divide-y divide-border/50">
        {providers.map((provider) => (
          <SettingsMenuItem
            key={provider.id}
            title={provider.name}
            subtitle={buildProviderSubtitle(
              provider.statusLabel,
              provider.lastSyncLabel,
              provider.enabled,
            )}
            icon={provider.icon}
            enabled={provider.enabled}
            onClick={() => handleProviderClick(provider.id)}
          />
        ))}
      </div>
    </section>
  );
}
