import type { AppData, BackupItem } from "../domain/types";
import { genId } from "../utils/appHelpers";
import { readStorageJSON, writeStorageJSON } from "./localStorage";

export const BACKUP_STORAGE_KEY = "controlOperativo_backups";

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getLocalBackups(): BackupItem[] {
  return readStorageJSON<BackupItem[]>(BACKUP_STORAGE_KEY) ?? [];
}

export function saveLocalBackups(backups: BackupItem[]): boolean {
  return writeStorageJSON(BACKUP_STORAGE_KEY, backups);
}

export function createBackup(data: AppData, motivo: string): boolean {
  const backups = getLocalBackups();
  const stringified = JSON.stringify(data);
  const size = formatBytes(new Blob([stringified]).size);
  const newBackup: BackupItem = {
    id: genId(),
    fecha: new Date().toISOString(),
    motivo,
    data,
    tamaño: size,
  };
  const updated = [newBackup, ...backups];
  if (updated.length > 10) updated.splice(10);
  return saveLocalBackups(updated);
}
