import { describe, expect, it } from "vitest";
import { isValidEmail, isValidPhone, isValidRut, validateGeneral } from "../shared/formHelpers";

// ── validateGeneral ──────────────────────────────────────────────────────────

describe("validateGeneral — campo principal", () => {
  it("error si el campo principal está vacío", () => {
    const { errors } = validateGeneral({ curso: "" }, "curso", "Nombre del curso");
    expect(errors.curso).toMatch(/obligatorio/i);
  });

  it("sin error si el campo principal tiene valor", () => {
    const { errors } = validateGeneral({ curso: "Excel avanzado" }, "curso", "Nombre del curso");
    expect(errors.curso).toBeUndefined();
  });

  it("error si campo principal es solo espacios", () => {
    const { errors } = validateGeneral({ curso: "   " }, "curso", "Nombre del curso");
    expect(errors.curso).toBeDefined();
  });
});

describe("validateGeneral — prioridad P1 Crítico", () => {
  const base = { proceso: "Revisión", prioridad: "P1 Crítico" };

  it("error si no hay responsable", () => {
    const { errors } = validateGeneral({ ...base, responsableId: "" }, "proceso", "Proceso");
    expect(errors.responsableId).toMatch(/responsable/i);
  });

  it("error si próxima acción está vacía", () => {
    const { errors } = validateGeneral({ ...base, responsableId: "r1", proximaAccion: "" }, "proceso", "Proceso");
    expect(errors.proximaAccion).toBeDefined();
  });

  it("error si fecha próxima acción está vacía", () => {
    const { errors } = validateGeneral({ ...base, responsableId: "r1", proximaAccion: "Revisar", fechaProximaAccion: "" }, "proceso", "Proceso");
    expect(errors.fechaProximaAccion).toBeDefined();
  });

  it("sin errores P1 cuando todo está completo", () => {
    const form = { ...base, responsableId: "r1", proximaAccion: "Revisar", fechaProximaAccion: "2099-12-31" };
    const { errors } = validateGeneral(form, "proceso", "Proceso");
    expect(errors.responsableId).toBeUndefined();
    expect(errors.proximaAccion).toBeUndefined();
    expect(errors.fechaProximaAccion).toBeUndefined();
  });
});

describe("validateGeneral — estado Detenido", () => {
  const base = { curso: "Excel", estado: "Detenido" };

  it("error si bloqueadoPor es 'Sin bloqueo'", () => {
    const { errors } = validateGeneral({ ...base, bloqueadoPor: "Sin bloqueo", observaciones: "algo" }, "curso", "Curso");
    expect(errors.bloqueadoPor).toBeDefined();
  });

  it("error si observaciones está vacío", () => {
    const { errors } = validateGeneral({ ...base, bloqueadoPor: "Proveedor", observaciones: "" }, "curso", "Curso");
    expect(errors.observaciones).toBeDefined();
  });

  it("sin errores cuando detenido está completo", () => {
    const { errors } = validateGeneral({ ...base, bloqueadoPor: "Proveedor", observaciones: "Esperando respuesta" }, "curso", "Curso");
    expect(errors.bloqueadoPor).toBeUndefined();
    expect(errors.observaciones).toBeUndefined();
  });
});

describe("validateGeneral — advertencias", () => {
  it("advertencia si requiereOC=Sí sin número OC", () => {
    const { warnings } = validateGeneral({ curso: "Excel", requiereOC: "Sí", numeroOC: "" }, "curso", "Curso");
    expect(warnings.some(w => w.includes("OC"))).toBe(true);
  });

  it("sin advertencia OC si requiereOC=No", () => {
    const { warnings } = validateGeneral({ curso: "Excel", requiereOC: "No", numeroOC: "" }, "curso", "Curso");
    expect(warnings.some(w => w.includes("OC"))).toBe(false);
  });

  it("advertencia si fechaProximaAccion ya vencida", () => {
    const { warnings } = validateGeneral({ curso: "Excel", fechaProximaAccion: "2000-01-01" }, "curso", "Curso");
    expect(warnings.some(w => w.includes("vencida"))).toBe(true);
  });

  it("advertencia si registro cerrado con bloqueo activo", () => {
    const { warnings } = validateGeneral({ curso: "Excel", estado: "Cerrado", bloqueadoPor: "Proveedor" }, "curso", "Curso");
    expect(warnings.some(w => w.includes("cerrado"))).toBe(true);
  });

  it("sin advertencia si cerrado y sin bloqueo", () => {
    const { warnings } = validateGeneral({ curso: "Excel", estado: "Cerrado", bloqueadoPor: "Sin bloqueo" }, "curso", "Curso");
    expect(warnings.some(w => w.includes("cerrado"))).toBe(false);
  });
});

// ── Validators de formato ────────────────────────────────────────────────────

describe("isValidEmail", () => {
  it.each(["user@example.com", "a.b+c@x.cl", "test@sub.domain.org"])("acepta %s", (e) => expect(isValidEmail(e)).toBe(true));
  it.each(["notanemail", "@nodomain.com", "missing@", ""])("rechaza %s", (e) => expect(isValidEmail(e)).toBe(false));
});

describe("isValidPhone", () => {
  it.each(["+56 9 1234 5678", "23456789", "(2) 123-456"])("acepta %s", (p) => expect(isValidPhone(p)).toBe(true));
  it.each(["123", "abc", ""])("rechaza %s", (p) => expect(isValidPhone(p)).toBe(false));
});

describe("isValidRut", () => {
  it.each(["12.345.678-9", "12345678-9", "9.876.543-K", "1.234.567-k"])("acepta %s", (r) => expect(isValidRut(r)).toBe(true));
  it.each(["not-a-rut", "1234", ""])("rechaza %s", (r) => expect(isValidRut(r)).toBe(false));
});
