import type { AppData } from "../domain/types";

export type XlsxSheetRows = [string, any[]][];

export function buildExportSheets(data: AppData, getResponsableName: (data: AppData, id: string) => string): XlsxSheetRows {
  return [
    ["Cursos", data.cursos.map((c) => ({ ...c, responsable: getResponsableName(data, c.responsableId) }))],
    ["OCs", data.ocs.map((o) => ({ ...o, responsable: getResponsableName(data, o.responsableId) }))],
    ["Practicantes", data.practicantes.map((p) => ({ ...p, responsable: getResponsableName(data, p.responsableId) }))],
    ["Presupuesto", data.presupuesto.map((p) => ({ ...p, disponible: p.presupuestoTotal - p.gastado, porcentajeUtilizado: Math.round((p.gastado / p.presupuestoTotal) * 100), responsable: getResponsableName(data, p.responsableId) }))],
    ["Procesos", data.procesos.map((p) => ({ ...p, responsable: getResponsableName(data, p.responsableId) }))],
    ["Diplomas", data.diplomas.map((d) => ({ ...d, responsable: getResponsableName(data, d.responsableId) }))],
    ["Evaluaciones Psicolaborales", data.evaluacionesPsicolaborales.map((e) => ({ ...e, responsable: getResponsableName(data, e.responsableId) }))],
    ["Carga Semanal", data.cargaSemanal],
    ["Contactos", data.contactos],
    ["Vales de Gas", data.valesGas.map((v) => ({ ...v, responsable: getResponsableName(data, v.responsableId) }))],
    ["Vales Gas Organización", (data.valesGasOrganizacion || []).map((v) => ({ ...v, responsable: getResponsableName(data, v.responsableId) }))],
    ["Reclutamiento", (data.reclutamiento || []).map((r) => ({ ...r, responsable: getResponsableName(data, r.reclutadorId) }))],
  ];
}
