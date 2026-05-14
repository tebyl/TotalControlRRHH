import { describe, expect, it } from "vitest";
import { migrateData, CURRENT_SCHEMA_VERSION } from "../storage/migrations";
import type { AppData } from "../domain/types";

const emptyFallback: AppData = {
  cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [],
  diplomas: [], cargaSemanal: [], contactos: [], evaluacionesPsicolaborales: [],
  valesGas: [], valesGasOrganizacion: [], reclutamiento: [],
  meta: { version: String(CURRENT_SCHEMA_VERSION), ultimaExportacion: "", actualizado: "" },
};

describe("migrateData", () => {
  it("returns valid AppData from empty object", () => {
    const result = migrateData({}, emptyFallback);
    expect(result.cursos).toEqual([]);
    expect(result.contactos).toEqual([]);
    expect(result.meta.version).toBe(String(CURRENT_SCHEMA_VERSION));
  });

  it("preserves existing records", () => {
    const input = {
      cursos: [{ id: "c1", curso: "Excel", estado: "En progreso" }],
      contactos: [],
    };
    const result = migrateData(input, emptyFallback);
    expect(result.cursos.length).toBe(1);
    expect(result.cursos[0].id).toBe("c1");
  });

  it("generates id for records missing it", () => {
    const input = { cursos: [{ curso: "Sin id" }] };
    const result = migrateData(input, emptyFallback);
    expect(result.cursos[0].id).toBeTruthy();
    expect(typeof result.cursos[0].id).toBe("string");
  });

  it("migrates responsable string to responsableId via contactos", () => {
    const input = {
      cursos: [{ id: "c1", responsable: "Ana García" }],
      contactos: [],
    };
    const result = migrateData(input, emptyFallback);
    expect(result.cursos[0].responsableId).toBeTruthy();
    const contact = result.contactos.find(c => c.nombre === "Ana García");
    expect(contact).toBeDefined();
    expect(result.cursos[0].responsableId).toBe(contact!.id);
  });

  it("reuses existing contact id for same responsable name", () => {
    const input = {
      cursos: [
        { id: "c1", responsable: "Ana García" },
        { id: "c2", responsable: "Ana García" },
      ],
      contactos: [],
    };
    const result = migrateData(input, emptyFallback);
    expect(result.cursos[0].responsableId).toBe(result.cursos[1].responsableId);
    const anaContacts = result.contactos.filter(c => c.nombre === "Ana García");
    expect(anaContacts.length).toBe(1);
  });

  it("does not create contact for 'Sin responsable'", () => {
    const input = { cursos: [{ id: "c1", responsable: "Sin responsable" }] };
    const result = migrateData(input, emptyFallback);
    expect(result.cursos[0].responsableId).toBe("");
    expect(result.contactos.length).toBe(0);
  });

  it("sets activo = Sí on existing contacts missing the field", () => {
    const input = {
      contactos: [{ id: "ct1", nombre: "Luis", activo: undefined }],
    };
    const result = migrateData(input, emptyFallback);
    expect(result.contactos[0].activo).toBe("Sí");
  });

  it("sets bloqueadoPor = Sin bloqueo on reclutamiento missing it", () => {
    const input = { reclutamiento: [{ id: "r1" }] };
    const result = migrateData(input, emptyFallback);
    expect(result.reclutamiento[0].bloqueadoPor).toBe("Sin bloqueo");
  });

  it("uses fallback when data is null", () => {
    const result = migrateData(null, emptyFallback);
    expect(result).toBeDefined();
  });

  it("updates meta.actualizado timestamp", () => {
    const result = migrateData({}, emptyFallback);
    expect(result.meta.actualizado).toBeTruthy();
    expect(result.meta.actualizado).not.toBe("");
  });
});
