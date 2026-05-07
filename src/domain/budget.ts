import type { PresupuestoItem } from "./types";
import { genId, hoy } from "../utils/appHelpers";

const BASE_BUDGET_CONCEPTS = [
  { key: "curso", concepto: "Cursos / Capacitaciones", modo: "Calculado desde registros" },
  { key: "oc", concepto: "Órdenes de Compra (OC)", modo: "Calculado desde registros" },
  { key: "practicante", concepto: "Practicantes", modo: "Calculado desde registros" },
  { key: "evaluaci", concepto: "Evaluaciones Psicolaborales", modo: "Calculado desde registros" },
  { key: "diploma", concepto: "Diplomas / Certificados", modo: "Manual" },
];

export function ensureBudgetRows(presupuesto: PresupuestoItem[]): PresupuestoItem[] {
  const updated = [...(presupuesto || [])];
  BASE_BUDGET_CONCEPTS.forEach((bc) => {
    const exists = updated.some((p) => p.concepto.toLowerCase().includes(bc.key));
    if (!exists) {
      updated.push({
        id: "pres_" + bc.key + "_" + genId(),
        concepto: bc.concepto,
        presupuestoTotal: 0,
        gastado: 0,
        responsableId: "",
        ultimaActualizacion: hoy(),
        observaciones: "Concepto inicial base en $0",
        montoComprometidoManual: 0,
        montoEjecutadoManual: 0,
        modoCalculo: bc.modo,
      });
    }
  });
  return updated;
}
