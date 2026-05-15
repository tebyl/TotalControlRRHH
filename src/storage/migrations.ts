import type {
  AppData,
  Contacto,
  Curso,
  Diploma,
  Evaluacion,
  OC,
  Practicante,
  PresupuestoItem,
  Proceso,
  ProcesoReclutamiento,
  ValeGas,
  ValeGasOrg,
} from "../domain/types";
import { ahora, genId } from "../utils/appHelpers";

export const CURRENT_SCHEMA_VERSION = 6;

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function migrateData(data: unknown, fallbackData: AppData): AppData {
  const oldData: any = data || fallbackData;
  const finalContactos: Contacto[] = [...(oldData.contactos || [])];
  const nameToIdMap = new Map<string, string>();

  finalContactos.forEach((c) => {
    if (!c.activo) c.activo = "Sí";
    const norm = normalizeName(c.nombre);
    if (norm) nameToIdMap.set(norm, c.id);
  });

  const addContactFromName = (name: string): string => {
    if (!name || name === "Sin responsable" || name === "") return "";
    const norm = normalizeName(name);
    if (nameToIdMap.has(norm)) return nameToIdMap.get(norm)!;

    const id = genId();
    finalContactos.push({
      id,
      nombre: name,
      rol: "Responsable",
      areaEmpresa: "",
      correo: "",
      telefono: "",
      relacion: "Interno",
      activo: "Sí",
      observaciones: "Migrado de responsable antiguo",
    });
    nameToIdMap.set(norm, id);
    return id;
  };

  const migrateResponsableId = (item: any): string => item.responsableId || (item.responsable ? addContactFromName(item.responsable) : "");

  const cursos: Curso[] = (oldData.cursos || []).map((c: any) => ({
    ...c,
    id: c.id || genId(),
    responsableId: migrateResponsableId(c),
  }) as Curso);

  const ocs: OC[] = (oldData.ocs || []).map((o: any) => ({
    ...o,
    id: o.id || genId(),
    categoriaOC: o.categoriaOC || "",
    responsableId: migrateResponsableId(o),
  }) as OC);

  const practicantes: Practicante[] = (oldData.practicantes || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p),
  }) as Practicante);

  const presupuesto: PresupuestoItem[] = (oldData.presupuesto || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p),
  }) as PresupuestoItem);

  const procesos: Proceso[] = (oldData.procesos || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p),
  }) as Proceso);

  const diplomas: Diploma[] = (oldData.diplomas || []).map((d: any) => ({
    ...d,
    id: d.id || genId(),
    responsableId: migrateResponsableId(d),
  }) as Diploma);

  const evaluacionesPsicolaborales: Evaluacion[] = (oldData.evaluacionesPsicolaborales || []).map((e: any) => ({
    ...e,
    id: e.id || genId(),
    responsableId: migrateResponsableId(e),
  }) as Evaluacion);

  const valesGas: ValeGas[] = (oldData.valesGas || []).map((v: any) => ({ ...v, id: v.id || genId() }));
  const valesGasOrganizacion: ValeGasOrg[] = (oldData.valesGasOrganizacion || []).map((v: any) => ({ ...v, id: v.id || genId() }));
  const reclutamiento: ProcesoReclutamiento[] = (oldData.reclutamiento || []).map((r: any) => ({ ...r, id: r.id || genId(), bloqueadoPor: r.bloqueadoPor || "Sin bloqueo" }));

  return {
    cursos,
    ocs,
    practicantes,
    presupuesto,
    procesos,
    diplomas,
    cargaSemanal: oldData.cargaSemanal || [],
    contactos: finalContactos,
    evaluacionesPsicolaborales,
    valesGas,
    valesGasOrganizacion,
    reclutamiento,
    meta: {
      version: String(CURRENT_SCHEMA_VERSION),
      ultimaExportacion: oldData.meta?.ultimaExportacion || "",
      // Preserve existing timestamp; only stamp now if there was none (fresh data or schema upgrade)
      actualizado: oldData.meta?.actualizado || ahora(),
    },
  };
}
