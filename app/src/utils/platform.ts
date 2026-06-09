export interface RuntimeInfo {
  isTauri: boolean;
  label: string;
  detail?: string;
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  try {
    const { isTauri } = await import("@tauri-apps/api/core");

    if (isTauri()) {
      return {
        isTauri: true,
        label: "React + Tauri 2",
        detail: "Aplicativo desktop nativo em execução",
      };
    }
  } catch {
    // Tauri API indisponível fora do runtime desktop.
  }

  return {
    isTauri: false,
    label: "React + Vite (browser)",
    detail: "Use npm run tauri dev para abrir no Tauri",
  };
}
