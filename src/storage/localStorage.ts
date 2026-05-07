import { createDataToSave } from "../utils/appHelpers";

export const STORAGE_KEY = "control_operativo_kata_v5";

export function readStorageJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStorageJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] No se pudo guardar ${key}`, error);
    return false;
  }
}

export function removeStorageKey(key: string): void {
  localStorage.removeItem(key);
}

export function saveAppData<T extends { meta: Record<string, unknown> }>(key: string, data: T): boolean {
  return writeStorageJSON(key, createDataToSave(data));
}
