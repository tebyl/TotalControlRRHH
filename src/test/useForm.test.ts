import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useForm } from "../hooks/useForm";

const initial = { nombre: "", estado: "Pendiente", prioridad: "P3 Medio" };

describe("useForm", () => {
  it("inicializa con los valores por defecto cuando no hay editItem", () => {
    const { result } = renderHook(() => useForm(initial, null));
    expect(result.current.form).toEqual(initial);
  });

  it("inicializa con editItem cuando se provee", () => {
    const edit = { nombre: "Excel", estado: "En curso", prioridad: "P2 Alto" };
    const { result } = renderHook(() => useForm(initial, edit));
    expect(result.current.form).toEqual(edit);
  });

  it("set actualiza un campo sin mutar el resto", () => {
    const { result } = renderHook(() => useForm(initial, null));
    act(() => result.current.set("nombre", "React avanzado"));
    expect(result.current.form.nombre).toBe("React avanzado");
    expect(result.current.form.estado).toBe("Pendiente");
    expect(result.current.form.prioridad).toBe("P3 Medio");
  });

  it("set permite múltiples actualizaciones independientes", () => {
    const { result } = renderHook(() => useForm(initial, null));
    act(() => result.current.set("nombre", "Curso A"));
    act(() => result.current.set("estado", "En curso"));
    expect(result.current.form.nombre).toBe("Curso A");
    expect(result.current.form.estado).toBe("En curso");
  });

  it("reinicia el form cuando editItem cambia a null", () => {
    const edit = { nombre: "Excel", estado: "En curso", prioridad: "P2 Alto" };
    const { result, rerender } = renderHook(({ editItem }) => useForm(initial, editItem), { initialProps: { editItem: edit as any } });
    expect(result.current.form.nombre).toBe("Excel");
    rerender({ editItem: null });
    expect(result.current.form).toEqual(initial);
  });

  it("reinicia el form cuando editItem cambia a otro objeto", () => {
    const edit1 = { nombre: "Excel", estado: "En curso", prioridad: "P2 Alto" };
    const edit2 = { nombre: "PowerBI", estado: "Pendiente", prioridad: "P1 Crítico" };
    const { result, rerender } = renderHook(({ editItem }) => useForm(initial, editItem), { initialProps: { editItem: edit1 as any } });
    rerender({ editItem: edit2 });
    expect(result.current.form.nombre).toBe("PowerBI");
  });
});
