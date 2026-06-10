import { useSyncExternalStore } from "react";

import { homeStateService } from "@/features/home/state";

export function useActiveAccountId(): string {
  return useSyncExternalStore(
    (listener) => homeStateService.subscribe(listener),
    () => homeStateService.getState().activeAccountId,
    () => homeStateService.getState().activeAccountId,
  );
}

export function getActiveAccountId(): string {
  return homeStateService.getState().activeAccountId;
}
