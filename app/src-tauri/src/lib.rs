// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod attachment_storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            attachment_storage::attachment_validate_root,
            attachment_storage::attachment_copy_file,
            attachment_storage::attachment_stat_file,
            attachment_storage::attachment_path_exists,
            attachment_storage::attachment_write_temp_file,
            attachment_storage::attachment_remove_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
