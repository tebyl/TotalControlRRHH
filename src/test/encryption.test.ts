import { describe, expect, it } from "vitest";
import type { AppData } from "../domain/types";
import { decryptAppData, encryptAppData, isEncryptedPayload } from "../storage/encryption";

const sampleData: AppData = {
  cursos: [],
  ocs: [],
  practicantes: [],
  presupuesto: [],
  procesos: [],
  diplomas: [],
  cargaSemanal: [],
  contactos: [],
  evaluacionesPsicolaborales: [],
  valesGas: [],
  valesGasOrganizacion: [],
  reclutamiento: [],
  meta: { version: "6", ultimaExportacion: "", actualizado: "2026-01-01T00:00:00.000Z" },
};

describe("encryption", () => {
  it("encrypts and decrypts data with the same passphrase", async () => {
    const encrypted = await encryptAppData(sampleData, "clave-segura");
    expect(isEncryptedPayload(encrypted)).toBe(true);

    const decrypted = await decryptAppData(encrypted, "clave-segura");
    expect(decrypted).toEqual(sampleData);
  });

  it("fails to decrypt with a wrong passphrase", async () => {
    const encrypted = await encryptAppData(sampleData, "clave-segura");
    await expect(decryptAppData(encrypted, "incorrecta")).rejects.toBeTruthy();
  });
});
