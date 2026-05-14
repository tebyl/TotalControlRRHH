import { describe, expect, it } from "vitest";
import {
  durMesesEntre,
  formatDateCL,
  isClosedRecord,
  isValidDateCL,
  isValidIsoDate,
  markRecordClosed,
  normalizeDateFromXlsx,
  normalizeYesNo,
  parseXlsxMoney,
  parseXlsxNumber,
  parseDateCL,
  semaforo,
  toDDMMYYYY,
  duplicateRecord,
} from "../utils/appHelpers";

// ── semaforo ────────────────────────────────────────
describe("semaforo", () => {
  it("returns Vencido for past dates", () => {
    expect(semaforo("2020-01-01", "2026-05-14").label).toBe("Vencido");
  });
  it("returns Vence hoy", () => {
    expect(semaforo("2026-05-14", "2026-05-14").label).toBe("Vence hoy");
  });
  it("returns 1-3 días for 2 days ahead", () => {
    expect(semaforo("2026-05-16", "2026-05-14").label).toBe("1-3 días");
  });
  it("returns 4-7 días for 5 days ahead", () => {
    expect(semaforo("2026-05-19", "2026-05-14").label).toBe("4-7 días");
  });
  it("returns Sin urgencia for 10 days ahead", () => {
    expect(semaforo("2026-05-24", "2026-05-14").label).toBe("Sin urgencia");
  });
  it("returns Sin fecha when empty", () => {
    expect(semaforo("", "2026-05-14").label).toBe("Sin fecha");
  });
});

// ── isValidIsoDate ───────────────────────────────────
describe("isValidIsoDate", () => {
  it("accepts valid date", () => expect(isValidIsoDate("2026-05-14")).toBe(true));
  it("rejects invalid month", () => expect(isValidIsoDate("2026-13-01")).toBe(false));
  it("rejects Feb 30", () => expect(isValidIsoDate("2026-02-30")).toBe(false));
  it("rejects wrong format", () => expect(isValidIsoDate("14/05/2026")).toBe(false));
  it("accepts Feb 29 on leap year", () => expect(isValidIsoDate("2024-02-29")).toBe(true));
  it("rejects Feb 29 on non-leap year", () => expect(isValidIsoDate("2023-02-29")).toBe(false));
});

// ── isValidDateCL ────────────────────────────────────
describe("isValidDateCL", () => {
  it("accepts DD/MM/YYYY", () => expect(isValidDateCL("14/05/2026")).toBe(true));
  it("rejects ISO format", () => expect(isValidDateCL("2026-05-14")).toBe(false));
});

// ── formatDateCL / parseDateCL / toDDMMYYYY ─────────
describe("formatDateCL / parseDateCL", () => {
  it("formats ISO to DD/MM/YYYY", () => expect(formatDateCL("2026-05-14")).toBe("14/05/2026"));
  it("returns empty string for empty input", () => expect(formatDateCL("")).toBe(""));
  it("parses DD/MM/YYYY to ISO", () => expect(parseDateCL("14/05/2026")).toBe("2026-05-14"));
  it("returns empty for invalid parse", () => expect(parseDateCL("99/99/9999")).toBe(""));
  it("toDDMMYYYY is alias for formatDateCL", () => expect(toDDMMYYYY("2026-01-01")).toBe("01/01/2026"));
});

// ── durMesesEntre ────────────────────────────────────
describe("durMesesEntre", () => {
  it("returns months between two dates", () => {
    expect(durMesesEntre("2026-01-01", "2026-07-01")).toBeGreaterThanOrEqual(5);
  });
  it("returns at least 1 for same-day dates", () => {
    expect(durMesesEntre("2026-05-14", "2026-05-14")).toBe(1);
  });
  it("returns 0 for empty dates", () => {
    expect(durMesesEntre("", "2026-05-14")).toBe(0);
  });
});

// ── normalizeYesNo ───────────────────────────────────
describe("normalizeYesNo", () => {
  it("normalizes SI to Sí", () => expect(normalizeYesNo("SI")).toBe("Sí"));
  it("normalizes sí to Sí", () => expect(normalizeYesNo("SÍ")).toBe("Sí"));
  it("normalizes NO to No", () => expect(normalizeYesNo("NO")).toBe("No"));
  it("returns empty for falsy", () => expect(normalizeYesNo("")).toBe(""));
  it("preserves unrecognized values", () => expect(normalizeYesNo("Tal vez")).toBe("Tal vez"));
});

// ── normalizeDateFromXlsx ────────────────────────────
describe("normalizeDateFromXlsx", () => {
  it("parses DD/MM/YYYY string", () => expect(normalizeDateFromXlsx("14/05/2026")).toBe("2026-05-14"));
  it("parses YYYY-MM-DD string", () => expect(normalizeDateFromXlsx("2026-05-14")).toBe("2026-05-14"));
  it("returns empty for null", () => expect(normalizeDateFromXlsx(null)).toBe(""));
  it("returns empty for invalid string", () => expect(normalizeDateFromXlsx("not-a-date")).toBe(""));
  it("parses Excel serial number", () => {
    // Excel serial 45000 → 2023-03-15 approx; just check it produces a valid ISO date
    const result = normalizeDateFromXlsx(45000);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── parseXlsxNumber / parseXlsxMoney ────────────────
describe("parseXlsxNumber", () => {
  it("parses plain number string", () => expect(parseXlsxNumber("42")).toBe(42));
  it("returns 0 for empty", () => expect(parseXlsxNumber("")).toBe(0));
  it("returns 0 for NaN string", () => expect(parseXlsxNumber("abc")).toBe(0));
  it("strips currency symbols", () => expect(parseXlsxNumber("$1,000")).toBe(1000));
});

describe("parseXlsxMoney", () => {
  it("parses CLP format", () => expect(parseXlsxMoney("$1.500.000")).toBe(1500000));
  it("returns 0 for negative", () => expect(parseXlsxMoney("-500")).toBe(0));
  it("returns 0 for empty", () => expect(parseXlsxMoney("")).toBe(0));
});

// ── isClosedRecord ───────────────────────────────────
describe("isClosedRecord", () => {
  it("identifies closed curso", () => expect(isClosedRecord({ estado: "Cerrado" }, "cursos")).toBe(true));
  it("identifies open curso", () => expect(isClosedRecord({ estado: "En progreso" }, "cursos")).toBe(false));
  it("identifies closed OC", () => expect(isClosedRecord({ estadoOC: "Cerrada" }, "ocs")).toBe(true));
  it("identifies completed diploma (etapa)", () => expect(isClosedRecord({ etapa: "Completado" }, "diplomas")).toBe(true));
  it("identifies closed evaluación", () => expect(isClosedRecord({ estado: "Cerrada" }, "evaluaciones")).toBe(true));
  it("returns false for null", () => expect(isClosedRecord(null, "cursos")).toBe(false));
});

// ── markRecordClosed ─────────────────────────────────
describe("markRecordClosed", () => {
  it("sets estado to closed state", () => {
    const result = markRecordClosed("cursos", { id: "1", estado: "En progreso" }, "Cerrado", "2026-05-14") as any;
    expect(result.estado).toBe("Cerrado");
    expect(result.ultimaActualizacion).toBe("2026-05-14");
  });
  it("marks diplomas with BUK fields", () => {
    const result = markRecordClosed("diplomas", { id: "1" }, "Subido", "2026-05-14") as any;
    expect(result.estadoBUK).toBe("Subido");
    expect(result.etapa).toBe("Completado");
    expect(result.fechaSubidaBUK).toBe("2026-05-14");
  });
});

// ── duplicateRecord ──────────────────────────────────
describe("duplicateRecord", () => {
  it("assigns new id", () => {
    const result = duplicateRecord("cursos", { id: "old", curso: "Taller" }, "new-id", "2026-05-14");
    expect(result.id).toBe("new-id");
  });
  it("appends (copia) to curso name", () => {
    const result = duplicateRecord("cursos", { id: "1", curso: "Excel" }, "2", "2026-05-14");
    expect(result.curso).toBe("Excel (copia)");
  });
  it("appends note to reclutamiento observaciones", () => {
    const result = duplicateRecord("reclutamiento", { id: "1", observaciones: "" }, "2", "2026-05-14");
    expect(result.observaciones).toContain("Copia de registro anterior");
  });
});
