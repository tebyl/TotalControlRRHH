import { describe, expect, it } from "vitest";
import { ensureBudgetRows } from "../domain/budget";

const BASE_KEYS = ["curso", "oc", "practicante", "evaluaci", "diploma"];

describe("ensureBudgetRows", () => {
  it("adds all 5 base rows when presupuesto is empty", () => {
    const result = ensureBudgetRows([]);
    expect(result.length).toBe(5);
    BASE_KEYS.forEach(key => {
      expect(result.some(r => r.concepto.toLowerCase().includes(key))).toBe(true);
    });
  });

  it("does not duplicate rows that already exist", () => {
    const existing = [{
      id: "pres_1",
      concepto: "Cursos / Capacitaciones",
      presupuestoTotal: 1000000,
      gastado: 0,
      responsableId: "",
      ultimaActualizacion: "2026-05-14",
      observaciones: "",
    }];
    const result = ensureBudgetRows(existing);
    const cursoRows = result.filter(r => r.concepto.toLowerCase().includes("curso"));
    expect(cursoRows.length).toBe(1);
  });

  it("preserves existing row values", () => {
    const existing = [{
      id: "pres_1",
      concepto: "Cursos / Capacitaciones",
      presupuestoTotal: 999,
      gastado: 500,
      responsableId: "c1",
      ultimaActualizacion: "2026-05-14",
      observaciones: "nota",
    }];
    const result = ensureBudgetRows(existing);
    const cursoRow = result.find(r => r.concepto.toLowerCase().includes("curso"));
    expect(cursoRow?.presupuestoTotal).toBe(999);
    expect(cursoRow?.gastado).toBe(500);
  });

  it("initializes new rows with presupuestoTotal = 0", () => {
    const result = ensureBudgetRows([]);
    result.forEach(r => expect(r.presupuestoTotal).toBe(0));
  });

  it("handles null/undefined gracefully", () => {
    const result = ensureBudgetRows(undefined as any);
    expect(result.length).toBe(5);
  });

  it("new rows have unique ids", () => {
    const result = ensureBudgetRows([]);
    const ids = result.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
