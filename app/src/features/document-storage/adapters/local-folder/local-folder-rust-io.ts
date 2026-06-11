import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "@tauri-apps/api/core";

export async function validateStorageRootViaRust(
  rootPath: string,
): Promise<void> {
  await invoke<void>("attachment_validate_root", { rootPath });
}

export async function copyAttachmentFileViaRust(
  fromPath: string,
  toPath: string,
): Promise<void> {
  await invoke<void>("attachment_copy_file", {
    fromPath,
    toPath,
  });
}

export async function statAttachmentFileViaRust(path: string): Promise<number> {
  return invoke<number>("attachment_stat_file", { path });
}

export async function attachmentPathExistsViaRust(path: string): Promise<boolean> {
  return invoke<boolean>("attachment_path_exists", { path });
}

export async function writeTempAttachmentFileViaRust(
  content: string,
): Promise<string> {
  return invoke<string>("attachment_write_temp_file", { content });
}

export async function removeAttachmentFileViaRust(path: string): Promise<void> {
  await invoke<void>("attachment_remove_file", { path });
}

export function isRustAttachmentIoAvailable(): boolean {
  return isTauri();
}
