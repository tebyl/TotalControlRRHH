import { describe, expect, it } from "vitest";
import { fmtCLP, getResponsableName, resolveResponsable } from "../shared/dataHelpers";
import type { AppData } from "../domain/types";

// ── fmtCLP ───────────────────────────────────────────────────────────────────

describe("fmtCLP", () => {
  it("formatea número con separador de miles chileno", () => {
    expect(fmtCLP(1000000)).toBe("$1.000.000");
  });
  it("formatea cero", () => {
    expect(fmtCLP(0)).toBe("$0");
  });
  it("devuelve guión para null/undefined", () => {
    expect(fmtCLP(null as any)).toBe("-");
    expect(fmtCLP(undefined as any)).toBe("-");
  });
});

// ── getResponsableName ────────────────────────────────────────────────────────

const mockData = {
  contactos: [
    { id: "c1", nombre: "Ana López", activo: "Sí", cargo: "", email: "", telefono: "", area: "" },
    { id: "c2", nombre: "Pedro Gómez", activo: "No", cargo: "", email: "", telefono: "", area: "" },
  ],
} as unknown as AppData;

describe("getResponsableName", () => {
  it("devuelve el nombre del contacto por id", () => {
    expect(getResponsableName(mockData, "c1")).toBe("Ana López");
  });
  it("devuelve nombre de contacto inactivo también", () => {
    expect(getResponsableName(mockData, "c2")).toBe("Pedro Gómez");
  });
  it("devuelve 'Sin responsable' si el id no existe", () => {
    expect(getResponsableName(mockData, "inexistente")).toBe("Sin responsable");
  });
  it("devuelve 'Sin responsable' si id es vacío", () => {
    expect(getResponsableName(mockData, "")).toBe("Sin responsable");
  });
});

// ── resolveResponsable ────────────────────────────────────────────────────────

describe("resolveResponsable", () => {
  const contactos = [
    { id: "c1", nombre: "Ana López", activo: "Sí", cargo: "", email: "", telefono: "", area: "" },
  ];

  it("reutiliza id si el nombre ya existe en contactos", () => {
    const { id, contactosActualizados } = resolveResponsable("Ana López", contactos);
    expect(id).toBe("c1");
    expect(contactosActualizados).toHaveLength(1);
  });

  it("crea un nuevo contacto si el nombre no existe", () => {
    const { id, contactosActualizados } = resolveResponsable("María Soto", contactos);
    expect(id).toBeTruthy();
    expect(id).not.toBe("c1");
    expect(contactosActualizados).toHaveLength(2);
    expect(contactosActualizados.find(c => c.nombre === "María Soto")).toBeDefined();
  });

  it("nuevo contacto usa el prefijo en la relación", () => {
    const { contactosActualizados } = resolveResponsable("Carlos Ruiz", contactos, "Externo");
    const nuevo = contactosActualizados.find(c => c.nombre === "Carlos Ruiz");
    expect(nuevo?.relacion).toBe("Interno");
  });

  it("devuelve cadena vacía si el nombre está vacío", () => {
    const { id } = resolveResponsable("", contactos);
    expect(id).toBe("");
  });
});
