import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormCursos } from "../forms/FormCursos";
import type { AppData } from "../domain/types";

const emptyData: AppData = {
  contactos: [{ id: "c1", nombre: "Ana López", activo: "Sí", cargo: "RRHH", email: "", telefono: "", area: "", notas: "", id_contacto: "" }],
  cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [],
  diplomas: [], evaluacionesPsicolaborales: [], cargaSemanal: [],
  reclutamiento: [], valesGas: [], valesGasOrg: [],
  meta: { version: 6, lastSaved: "" },
} as unknown as AppData;

function setup(editItem: any = null) {
  const closeModal = vi.fn();
  const saveItem = vi.fn();
  render(<FormCursos data={emptyData} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />);
  return { closeModal, saveItem };
}

describe("FormCursos — renderizado", () => {
  it("renderiza los campos principales", () => {
    setup();
    expect(screen.getByText(/Curso \/ Capacitación/i)).toBeInTheDocument();
    expect(screen.getByText(/Estado/i)).toBeInTheDocument();
    expect(screen.getByText(/Prioridad/i)).toBeInTheDocument();
  });

  it("muestra botones Cancelar y Guardar", () => {
    setup();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
  });
});

describe("FormCursos — validación al guardar", () => {
  it("no llama saveItem si el campo curso está vacío", () => {
    const { saveItem } = setup();
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(saveItem).not.toHaveBeenCalled();
  });

  it("muestra error de validación si curso está vacío", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    const errors = screen.getAllByText(/obligatorio/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("llama saveItem con los datos cuando el formulario es válido", () => {
    const { saveItem } = setup();
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.change(input, { target: { value: "Excel avanzado" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(saveItem).toHaveBeenCalledOnce();
    expect(saveItem).toHaveBeenCalledWith("cursos", expect.objectContaining({ curso: "Excel avanzado" }));
  });
});

describe("FormCursos — cancelar", () => {
  it("llama closeModal al hacer clic en Cancelar", () => {
    const { closeModal } = setup();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(closeModal).toHaveBeenCalledOnce();
  });
});

describe("FormCursos — edición", () => {
  it("precarga los valores del item en edición", () => {
    const editItem = { curso: "PowerBI", origen: "DNC", estado: "En curso", prioridad: "P2 Alto", area: "", solicitante: "", fechaSolicitud: "", fechaRequerida: "", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", responsableId: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" };
    setup(editItem);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("PowerBI");
  });
});
