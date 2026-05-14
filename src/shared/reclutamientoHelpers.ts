import type { ProcesoReclutamiento } from "../domain/types";
import { ETAPAS_RECLUTAMIENTO, ETAPAS_NO_APLICA_VALUES, ETAPAS_COMPLETADAS_VALUES } from "../domain/options";

export function calcReclutamientoAvance(r: ProcesoReclutamiento): { pct: number; etapaActual: string } {
  if (r.proceso === "Cerrado") return { pct: 100, etapaActual: "Cerrado" };
  if (r.proceso === "Desistido") return { pct: 0, etapaActual: "Desistido" };
  if (r.proceso === "Pausado") return { pct: calcPctRecl(r), etapaActual: "Pausado — revisar bloqueo" };
  let completadas = 0;
  let aplicables = 0;
  let etapaActual = "Listo para ingreso";
  let encontradaPendiente = false;
  for (const etapa of ETAPAS_RECLUTAMIENTO) {
    const val = (r as any)[etapa.key] || "";
    if (ETAPAS_NO_APLICA_VALUES.includes(val)) continue;
    aplicables++;
    if (ETAPAS_COMPLETADAS_VALUES.includes(val)) {
      completadas++;
    } else if (!encontradaPendiente) {
      etapaActual = etapa.label;
      encontradaPendiente = true;
    }
  }
  const pct = aplicables === 0 ? 0 : Math.round((completadas / aplicables) * 100);
  return { pct, etapaActual: encontradaPendiente ? etapaActual : "Listo para ingreso" };
}

export function calcPctRecl(r: ProcesoReclutamiento): number {
  let completadas = 0, aplicables = 0;
  for (const etapa of ETAPAS_RECLUTAMIENTO) {
    const val = (r as any)[etapa.key] || "";
    if (ETAPAS_NO_APLICA_VALUES.includes(val)) continue;
    aplicables++;
    if (ETAPAS_COMPLETADAS_VALUES.includes(val)) completadas++;
  }
  return aplicables === 0 ? 0 : Math.round((completadas / aplicables) * 100);
}
