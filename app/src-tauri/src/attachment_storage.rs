use std::fs;
use std::path::PathBuf;

const TEST_DIR: &str = ".fluxor-permission-test";
const TEST_FILE: &str = "write-test.txt";
const TEST_CONTENT: &str = "fluxor-permission-test";

fn normalize_path(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Caminho inválido".into());
    }

    let path = PathBuf::from(trimmed);
    if !path.is_absolute() {
        return Err(format!(
            "Caminho relativo não permitido: {trimmed}. Reconfigure a pasta raiz em Local Storage."
        ));
    }

    Ok(path)
}

fn path_for_optional_io(path: &str) -> Option<PathBuf> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return None;
    }

    let path = PathBuf::from(trimmed);
    if !path.is_absolute() {
        return None;
    }

    Some(path)
}

#[tauri::command]
pub fn attachment_validate_root(root_path: String) -> Result<(), String> {
    let root = normalize_path(&root_path)?;
    let test_dir = root.join(TEST_DIR);
    let test_file = test_dir.join(TEST_FILE);

    fs::create_dir_all(&test_dir).map_err(|error| format!("mkdir: {error}"))?;
    fs::write(&test_file, TEST_CONTENT).map_err(|error| format!("write: {error}"))?;

    let content =
        fs::read_to_string(&test_file).map_err(|error| format!("read: {error}"))?;
    if content != TEST_CONTENT {
        return Err("read: conteúdo inválido".into());
    }

    fs::remove_file(&test_file).map_err(|error| format!("remove file: {error}"))?;
    fs::remove_dir(&test_dir).map_err(|error| format!("remove dir: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn attachment_copy_file(from_path: String, to_path: String) -> Result<(), String> {
    let from = normalize_path(&from_path)?;
    let to = normalize_path(&to_path)?;

    if !from.is_file() {
        return Err(format!("copy: arquivo de origem não encontrado: {}", from.display()));
    }

    if let Some(parent) = to.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("mkdir: {error}"))?;
    }

    let bytes = fs::copy(&from, &to).map_err(|error| format!("copy: {error}"))?;
    if bytes == 0 {
        return Err("copy: nenhum byte copiado".into());
    }

    Ok(())
}

#[tauri::command]
pub fn attachment_stat_file(path: String) -> Result<u64, String> {
    let path = normalize_path(&path)?;
    let metadata = fs::metadata(&path).map_err(|error| format!("stat: {error}"))?;
    Ok(metadata.len())
}

#[tauri::command]
pub fn attachment_path_exists(path: String) -> Result<bool, String> {
    Ok(path_for_optional_io(&path)
        .map(|path| path.is_file())
        .unwrap_or(false))
}

#[tauri::command]
pub fn attachment_write_temp_file(content: String) -> Result<String, String> {
    let path = std::env::temp_dir().join(format!(
        "fluxor-dev-store-test-{}.txt",
        std::process::id()
    ));

    fs::write(&path, content).map_err(|error| format!("write temp: {error}"))?;

    path.to_str()
        .map(str::to_string)
        .ok_or_else(|| "write temp: caminho inválido".into())
}

#[tauri::command]
pub fn attachment_remove_file(path: String) -> Result<(), String> {
    let Some(path) = path_for_optional_io(&path) else {
        return Ok(());
    };

    if path.is_file() {
        fs::remove_file(&path).map_err(|error| format!("remove: {error}"))?;
    }

    Ok(())
}
