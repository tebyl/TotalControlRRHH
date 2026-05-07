import { describe, expect, it } from "vitest";
import {
  createDataToSave,
  duplicateRecord,
  durMesesEntre,
  formatDateCL,
  getWeeksForYear,
  isTableRowClosed,
  markRecordClosed,
  normalizeDateFromXlsx,
  parseDateCL,
  semaforo,
} from "../utils/appHelpers";
import { getStatusField } from "../domain/moduleConfig";
import { ensureBudgetRows } from "../domain/budget";
import { migrateData } from "../storage/migrations";

describe("formatDateCL", () => {
  it("convierte ISO a dd/mm/yyyy", () => {
    expect(formatDateCL("2026-05-15")).toBe("15/05/2026");
  });

  it("devuelve el mismo valor si ya tiene /", () => {
    expect(formatDateCL("15/05/2026")).toBe("15/05/2026");
  });

  it("devuelve string vacío para valor vacío", () => {
    expect(formatDateCL("")).toBe("");
    expect(formatDateCL(undefined)).toBe("");
  });
});

describe("parseDateCL", () => {
  it("convierte dd/mm/yyyy a ISO", () => {
    expect(parseDateCL("15/05/2026")).toBe("2026-05-15");
  });

  it("rellena ceros en día y mes cortos", () => {
    expect(parseDateCL("5/3/2026")).toBe("2026-03-05");
  });

  it("rechaza fechas calendario inválidas", () => {
    expect(parseDateCL("31/02/2026")).toBe("");
    expect(normalizeDateFromXlsx("99/99/2026")).toBe("");
  });
});

describe("semaforo", () => {
  it("retorna Sin fecha si no hay fecha", () => {
    expect(semaforo("").label).toBe("Sin fecha");
  });

  it("detecta fecha vencida", () => {
    expect(semaforo("2026-05-01", "2026-05-07").label).toBe("Vencido");
  });

  it("detecta sin urgencia para fecha futura lejana", () => {
    expect(semaforo("2026-05-30", "2026-05-07").label).toBe("Sin urgencia");
  });

  it("el orden de vencido es menor que sin urgencia", () => {
    expect(semaforo("2026-05-01", "2026-05-07").order).toBeLessThan(semaforo("2026-05-30", "2026-05-07").order);
  });
});

describe("durMesesEntre", () => {
  it("calcula meses entre dos fechas", () => {
    expect(durMesesEntre("2026-01-01", "2026-07-01")).toBeCloseTo(6, 0);
  });

  it("retorna 0 si alguna fecha está vacía", () => {
    expect(durMesesEntre("", "2026-07-01")).toBe(0);
    expect(durMesesEntre("2026-01-01", "")).toBe(0);
  });

  it("retorna mínimo 1 si las fechas son iguales", () => {
    expect(durMesesEntre("2026-01-01", "2026-01-01")).toBe(1);
  });
});

describe("getWeeksForYear", () => {
  it("genera semanas para 2026", () => {
    const weeks = getWeeksForYear(2026);
    expect(weeks.length).toBeGreaterThan(51);
    expect(weeks[0].label).toBe("Semana 1");
  });

  it("no genera más de 53 semanas", () => {
    expect(getWeeksForYear(2026).length).toBeLessThanOrEqual(53);
  });
});

describe("operaciones de registros", () => {
  it("obtiene el campo de estado desde configuración central", () => {
    expect(getStatusField("ocs")).toBe("estadoOC");
    expect(getStatusField("reclutamiento")).toBe("proceso");
  });

  it("cierra una OC usando estadoOC", () => {
    const oc = { id: "oc1", estadoOC: "Solicitada", estado: "no usar", ultimaActualizacion: "2026-05-01" };
    const closed = markRecordClosed("ocs", oc, "Cerrada", "2026-05-07");
    expect(closed.estadoOC).toBe("Cerrada");
    expect(closed.estado).toBe("no usar");
    expect(isTableRowClosed(closed, "Cerrada")).toBe(true);
  });

  it("cierra un proceso de reclutamiento usando proceso", () => {
    const reclutamiento = { id: "r1", proceso: "Abierto", ultimaActualizacion: "2026-05-01" };
    const closed = markRecordClosed("reclutamiento", reclutamiento, "Cerrado", "2026-05-07");
    expect(closed.proceso).toBe("Cerrado");
    expect(isTableRowClosed(closed, "Cerrado")).toBe(true);
  });

  it("duplica una evaluación psicolaboral con nuevo ID y cargo descriptivo", () => {
    const evaluacion = { id: "e1", cargo: "Analista", estado: "Solicitada", resultado: "Pendiente", ultimaActualizacion: "2026-05-01" };
    const duplicated = duplicateRecord("evaluacionesPsicolaborales", evaluacion, "e2", "2026-05-07");
    expect(duplicated.id).toBe("e2");
    expect(duplicated.cargo).toBe("Analista (copia)");
    expect(duplicated.estado).toBe("Solicitada");
  });

  it("duplica un reclutamiento sin alterar proceso", () => {
    const reclutamiento = { id: "r1", proceso: "Abierto", observaciones: "Original", plantaCentro: "Planta Bio Bio", ultimaActualizacion: "2026-05-01" };
    const duplicated = duplicateRecord("reclutamiento", reclutamiento, "r2", "2026-05-07");
    expect(duplicated.id).toBe("r2");
    expect(duplicated.proceso).toBe("Abierto");
    expect(duplicated.observaciones).toBe("Original (Copia de registro anterior)");
  });

  it("crea una copia inmutable para guardar datos", () => {
    const data = { cursos: [], meta: { version: "1.1", actualizado: "old" } };
    const saved = createDataToSave(data, "2026-05-07T10:00:00.000Z");
    expect(saved).not.toBe(data);
    expect(saved.meta).not.toBe(data.meta);
    expect(saved.meta.actualizado).toBe("2026-05-07T10:00:00.000Z");
    expect(data.meta.actualizado).toBe("old");
  });
});

describe("presupuesto y migración", () => {
  it("asegura filas base de presupuesto sin borrar las existentes", () => {
    const rows = ensureBudgetRows([{ id: "p1", concepto: "Practicantes", presupuestoTotal: 100, gastado: 0, responsableId: "", ultimaActualizacion: "2026-05-01", observaciones: "" }]);
    expect(rows.some((row) => row.concepto === "Practicantes")).toBe(true);
    expect(rows.some((row) => row.concepto.includes("Órdenes de Compra"))).toBe(true);
  });

  it("migra responsable antiguo a contacto y responsableId", () => {
    const fallback = {
      cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [], diplomas: [], cargaSemanal: [],
      contactos: [], evaluacionesPsicolaborales: [], valesGas: [], valesGasOrganizacion: [], reclutamiento: [],
      meta: { version: "1.1", ultimaExportacion: "", actualizado: "" },
    };
    const migrated = migrateData({
      cursos: [{ id: "c1", curso: "Excel", responsable: "Ana", estado: "Pendiente revisar" }],
      meta: {},
    }, fallback);
    expect(migrated.contactos[0].nombre).toBe("Ana");
    expect(migrated.cursos[0].responsableId).toBe(migrated.contactos[0].id);
  });
});
