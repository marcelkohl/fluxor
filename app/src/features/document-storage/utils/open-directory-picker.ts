import { open, type OpenDialogOptions } from "@tauri-apps/plugin-dialog";

type OpenDirectoryPickerOptions = Omit<
  OpenDialogOptions,
  "directory" | "recursive" | "multiple"
>;

export async function openDirectoryPicker(
  options: OpenDirectoryPickerOptions = {},
): Promise<string | null> {
  const selected = await open({
    ...options,
    directory: true,
    multiple: false,
    recursive: true,
  });

  if (!selected || Array.isArray(selected)) {
    return null;
  }

  return selected;
}
