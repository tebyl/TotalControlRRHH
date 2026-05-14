import type { AppData } from "../domain/types";

export const fmtCLP = (n: number) => n != null ? "$" + n.toLocaleString("es-CL") : "-";

export function resolveResponsable(nombre: string, contactos: any[], prefijo: string = "Interno"): { id: string; contactosActualizados: any[] } {
  if (!nombre || nombre.trim() === "" || nombre === "Sin responsable") return { id: "", contactosActualizados: contactos };
  const normalized = nombre.trim().toLowerCase();
  const existing = contactos.find((c: any) => c.nombre?.toLowerCase() === normalized);
  if (existing) return { id: existing.id, contactosActualizados: contactos };
  const newContact = {
    id: `contacto_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    nombre: nombre.trim(),
    rol: prefijo === "RRHH" ? "Reclutador" : "Responsable",
    areaEmpresa: "",
    correo: "",
    telefono: "",
    relacion: prefijo === "RRHH" ? "RRHH" : "Interno",
    activo: "Sí",
    observaciones: "Creado automáticamente al importar XLSX"
  };
  return { id: newContact.id, contactosActualizados: [...contactos, newContact] };
}

export function getResponsableName(data: AppData, id: string): string {
  if (!id) return "Sin responsable";
  const c = data.contactos.find(x => x.id === id);
  return c ? c.nombre : "Sin responsable";
}
