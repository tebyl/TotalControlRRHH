import { useEffect, useRef } from "react";
import { isClosedRecord, semaforo } from "../utils/appHelpers";
import type { AppData } from "../domain/types";

type AlertSummary = { vencidos: number; urgentesHoy: number; criticos: number };

function buildAlertSummary(data: AppData): AlertSummary {
  let vencidos = 0;
  let urgentesHoy = 0;
  let criticos = 0;

  const checkItem = (item: any, moduleKey: string, fechaFn: (x: any) => string, prioridadFn?: (x: any) => string) => {
    if (isClosedRecord(item, moduleKey)) return;
    const s = semaforo(fechaFn(item));
    if (s.label === "Vencido") vencidos++;
    if (s.label === "Vence hoy") urgentesHoy++;
    if (prioridadFn?.(item) === "P1 Crítico") criticos++;
  };

  data.cursos.forEach(c => checkItem(c, "cursos", x => x.fechaProximaAccion || x.fechaRequerida, x => x.prioridad));
  data.ocs.forEach(o => checkItem(o, "ocs", x => x.fechaLimite, x => x.prioridad));
  data.practicantes.forEach(p => checkItem(p, "practicantes", x => x.fechaProximaAccion || x.fechaTermino));
  data.procesos.forEach(p => checkItem(p, "procesos", x => x.fechaProximaAccion || x.fechaLimite, x => x.prioridad));
  data.diplomas.forEach(d => checkItem(d, "diplomas", x => x.fechaProximaAccion, x => x.prioridad));
  data.evaluacionesPsicolaborales.forEach(e => checkItem(e, "evaluacionesPsicolaborales", x => x.fechaProximaAccion || x.fechaEntregaInforme, x => x.prioridad));
  (data.reclutamiento || []).forEach(r => checkItem(r, "reclutamiento", x => x.fechaProximaAccion || x.fechaIngreso, x => x.prioridad));

  return { vencidos, urgentesHoy, criticos };
}

function buildNotificationBody({ vencidos, urgentesHoy, criticos }: AlertSummary): string {
  const parts: string[] = [];
  if (vencidos > 0) parts.push(`${vencidos} vencido${vencidos > 1 ? "s" : ""}`);
  if (urgentesHoy > 0) parts.push(`${urgentesHoy} vence${urgentesHoy > 1 ? "n" : ""} hoy`);
  if (criticos > 0) parts.push(`${criticos} P1 Crítico${criticos > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

const NOTIF_KEY = "controlrh_last_notif_date";

export function useNotifications(data: AppData, authenticated: boolean) {
  const fired = useRef(false);

  useEffect(() => {
    if (!authenticated || fired.current) return;
    if (!("Notification" in window)) return;

    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(NOTIF_KEY);
    // Only fire once per day per session
    if (lastDate === today) return;

    const send = () => {
      const summary = buildAlertSummary(data);
      const total = summary.vencidos + summary.urgentesHoy + summary.criticos;
      if (total === 0) return;

      fired.current = true;
      localStorage.setItem(NOTIF_KEY, today);

      new Notification("Control RH — Atención requerida", {
        body: buildNotificationBody(summary),
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        tag: "controlrh-daily",
      });
    };

    if (Notification.permission === "granted") {
      send();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        if (perm === "granted") send();
      });
    }
  }, [authenticated, data]);
}
