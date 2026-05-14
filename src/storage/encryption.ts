import type { AppData } from "../domain/types";

const PASSPHRASE_CACHE_KEY = "tcr_encryption_passphrase";
const ENCRYPTION_VERSION = 1;
const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptedPayload = {
  __encrypted: true;
  version: number;
  salt: string;
  iv: string;
  data: string;
};

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as EncryptedPayload;
  return v.__encrypted === true
    && typeof v.version === "number"
    && typeof v.salt === "string"
    && typeof v.iv === "string"
    && typeof v.data === "string";
}

export function cachePassphrase(passphrase: string): void {
  sessionStorage.setItem(PASSPHRASE_CACHE_KEY, passphrase);
}

export function getCachedPassphrase(): string | null {
  return sessionStorage.getItem(PASSPHRASE_CACHE_KEY);
}

export function clearCachedPassphrase(): void {
  sessionStorage.removeItem(PASSPHRASE_CACHE_KEY);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAppData(data: AppData, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    __encrypted: true,
    version: ENCRYPTION_VERSION,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(cipher)),
  };
}

export async function decryptAppData(payload: EncryptedPayload, passphrase: string): Promise<AppData> {
  const key = await deriveKey(passphrase, base64ToBytes(payload.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.data)
  );
  const decoded = new TextDecoder().decode(new Uint8Array(decrypted));
  return JSON.parse(decoded) as AppData;
}
