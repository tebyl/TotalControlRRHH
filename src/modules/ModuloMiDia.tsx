import React, { memo, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Filter,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Sun,
  UserRound,
  Zap,
} from "lucide-react";
import { Badge, SemaforoBadge, prioridadColor } from "../shared/badges";
import { getResponsableName } from "../shared/dataHelpers";
import { hoy, isClosedRecord, semaforo } from "../utils/appHelpers";
import type { AppData, ModuloKey, ProcesoReclutamiento } from "../domain/types";

type Modulo = ModuloKey;

function ModuloMiDia({ data, setActiveModulo, onCapturaRapida }: { data: AppData; setActiveModulo: (m: Modulo) => void; onCapturaRapida: () => void }) {
  const hoyStr = hoy();
  const hace7Str = new Date(new Date(hoyStr).getTime() - 7 * 86400000).toISOString().slice(0, 10);

  interface Tarjeta {
    tipo: string;
    nombre: string;
    prioridad: string;
    estado: string;
    responsable: string;
    proximaAccion: string;
    fecha: string;
    bloqueadoPor: string;
    modulo: Modulo;
    semaforoLabel: string;
    semaforoColor: string;
    order: number;
  }

    const allOpenItems = useMemo(() => {
      const items: Tarjeta[] = [];

      data.cursos.forEach(c => {
        if (isClosedRecord(c, "cursos")) return;
        const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
        items.push({
          tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado,
          responsable: getResponsableName(data, c.responsableId),
          proximaAccion: c.proximaAccion, fecha: c.fechaProximaAccion || c.fechaRequerida,
          bloqueadoPor: c.bloqueadoPor, modulo: "cursos",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.ocs.forEach(o => {
        if (isClosedRecord(o, "ocs")) return;
        const s = semaforo(o.fechaLimite);
        items.push({
          tipo: "OC", nombre: `${o.numeroOC} - ${o.cursoAsociado}`, prioridad: o.prioridad,
          estado: o.estadoOC, responsable: getResponsableName(data, o.responsableId),
          proximaAccion: o.accionPendiente, fecha: o.fechaLimite,
          bloqueadoPor: o.bloqueadoPor, modulo: "ocs",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.practicantes.forEach(p => {
        if (isClosedRecord(p, "practicantes")) return;
        const s = semaforo(p.fechaProximaAccion || p.fechaTermino);
        items.push({
          tipo: "Practicante", nombre: p.nombre, prioridad: "P3 Medio", estado: p.estado,
          responsable: getResponsableName(data, p.responsableId),
          proximaAccion: p.proximoPaso, fecha: p.fechaProximaAccion || p.fechaTermino,
          bloqueadoPor: p.bloqueadoPor, modulo: "practicantes",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.procesos.forEach(p => {
        if (isClosedRecord(p, "procesos")) return;
        const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
        items.push({
          tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad,
          estado: p.estadoActual, responsable: getResponsableName(data, p.responsableId),
          proximaAccion: p.proximaAccion, fecha: p.fechaProximaAccion || p.fechaLimite,
          bloqueadoPor: p.bloqueadoPor, modulo: "procesos",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.diplomas.forEach(d => {
        if (isClosedRecord(d, "diplomas")) return;
        const s = semaforo(d.fechaProximaAccion);
        items.push({
          tipo: "Diploma/Cert/Lic", nombre: `${d.tipoDocumento} - ${d.participante}`,
          prioridad: d.prioridad, estado: d.etapa, responsable: getResponsableName(data, d.responsableId),
          proximaAccion: d.proximaAccion, fecha: d.fechaProximaAccion,
          bloqueadoPor: d.bloqueadoPor, modulo: "diplomas",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.evaluacionesPsicolaborales.forEach(e => {
        if (isClosedRecord(e, "evaluacionesPsicolaborales")) return;
        const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
        items.push({
          tipo: "Eval. Psico", nombre: `${e.cargo} - ${e.candidato}`,
          prioridad: e.prioridad, estado: e.estado, responsable: getResponsableName(data, e.responsableId),
          proximaAccion: e.proximaAccion, fecha: e.fechaProximaAccion || e.fechaEntregaInforme,
          bloqueadoPor: e.bloqueadoPor, modulo: "evaluaciones",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      (data.reclutamiento || []).forEach((r: ProcesoReclutamiento) => {
        if (["Cerrado", "Desistido"].includes(r.proceso)) return;
        const fechaRef = r.fechaProximaAccion || r.fechaIngreso;
        const s = semaforo(fechaRef);
        items.push({
          tipo: "Reclutamiento", nombre: `${r.reclutamiento || "Proceso"} - ${r.plantaCentro}`,
          prioridad: r.prioridad, estado: r.proceso, responsable: getResponsableName(data, r.reclutadorId),
          proximaAccion: r.proximaAccion, fecha: fechaRef,
          bloqueadoPor: r.bloqueadoPor, modulo: "reclutamiento" as Modulo,
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      return items;
    }, [data]);

  const blocked = (b: string) => b && b !== "Sin bloqueo" && b !== "";

  const urgenteHoy = allOpenItems.filter(item =>
    item.semaforoLabel === "Vence hoy" || item.prioridad === "P1 Crítico"
  ).sort((a, b) => a.order - b.order);

  const vencido = allOpenItems.filter(item =>
    item.semaforoLabel === "Vencido"
  ).sort((a, b) => a.order - b.order);

  const bloqueadoList = allOpenItems.filter(item =>
    blocked(item.bloqueadoPor)
  ).sort((a, b) => a.order - b.order);

  const actualizar = allOpenItems.filter(item => {
    const c = data.cursos.find((x: any) => x.curso === item.nombre);
    const ult = (c as any)?.ultimaActualizacion || "";
    return (ult && ult < hace7Str) || (!item.proximaAccion && !item.fecha);
  }).sort((a, b) => a.order - b.order);

  type Seccion = {
    title: string;
    desc: string;
    items: Tarjeta[];
    accentBorder: string;
    pillColor: string;
    iconBg: string;
    iconEl: React.ReactNode;
  };

  const secciones: Seccion[] = [
    { title: "Urgente hoy", desc: "Fecha hoy o prioridad P1 Crítico", items: urgenteHoy, accentBorder: "border-l-red-500", pillColor: "bg-red-500", iconBg: "bg-red-100", iconEl: <AlertCircle size={14} className="text-red-500" /> },
    { title: "Vencido", desc: "Fecha límite anterior a hoy, sin cerrar", items: vencido, accentBorder: "border-l-orange-400", pillColor: "bg-orange-400", iconBg: "bg-orange-100", iconEl: <AlertTriangle size={14} className="text-orange-500" /> },
    { title: "Bloqueado", desc: "Registros con un bloqueo activo", items: bloqueadoList, accentBorder: "border-l-blue-400", pillColor: "bg-blue-400", iconBg: "bg-blue-100", iconEl: <Lock size={14} className="text-blue-500" /> },
    { title: "Actualizar antes de cerrar el día", desc: "Sin actualizar hace más de 7 días o sin próxima acción", items: actualizar, accentBorder: "border-l-amber-400", pillColor: "bg-amber-400", iconBg: "bg-amber-100", iconEl: <Clock size={14} className="text-amber-500" /> },
  ];

  const fechaLarga = new Date(hoyStr + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
            <Sun size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800 leading-tight">Mi Día</h1>
              <span className="text-sm text-slate-400 capitalize">{fechaLarga}</span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Qué revisar primero hoy, sin entrar a todos los módulos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={13} className="shrink-0" /> Filtros
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} className="shrink-0" /> Refrescar
          </button>
          <button
            onClick={onCapturaRapida}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Zap size={13} strokeWidth={2} className="shrink-0" /> + Captura rápida
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {secciones.map(sec => (
          <button key={sec.title} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <span className={`w-2 h-2 rounded-full ${sec.pillColor} shrink-0`} />
            {sec.items.length} {sec.title}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={12} className="shrink-0" />
          Última actualización: ahora
        </div>
      </div>

      {/* Quadrant grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {secciones.map(sec => (
          <div key={sec.title} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${sec.accentBorder} shadow-sm overflow-hidden`}>

            {/* Quadrant header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full ${sec.iconBg} flex items-center justify-center shrink-0`}>
                  {sec.iconEl}
                </div>
                <span className="text-sm font-bold text-slate-800">{sec.title}</span>
                <span className="text-[11px] font-semibold bg-slate-800 text-white rounded-full px-2 py-0.5 tabular-nums leading-none">
                  {sec.items.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:block">{sec.desc}</span>
                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
              </div>
            </div>

            {/* Item cards */}
            <div className="p-3 space-y-2">
              {sec.items.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-emerald-600">
                  <CheckCircle2 size={15} className="shrink-0" />
                  Sin elementos en esta categoría.
                </div>
              ) : (
                sec.items.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setActiveModulo(item.modulo)}
                  >
                    {/* Row 1: Tipo + Prioridad + Nombre + Semáforo */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge label={item.tipo} colorClass="bg-slate-100 text-slate-600 border border-slate-200" />
                      <Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} />
                      <span className="text-[13px] font-semibold text-slate-800 truncate flex-1 min-w-0">{item.nombre}</span>
                      {item.fecha && <div className="shrink-0"><SemaforoBadge fecha={item.fecha} /></div>}
                    </div>

                    {/* Row 2: Estado + Resp + Próx */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 shrink-0">
                        <ClipboardCheck size={11} className="text-slate-400" />
                        Estado: <span className="text-slate-700 font-medium ml-0.5">{item.estado}</span>
                      </span>
                      {item.responsable && (
                        <span className="flex items-center gap-1 shrink-0">
                          <UserRound size={11} className="text-slate-400" />
                          Resp: <span className="text-slate-700 ml-0.5">{item.responsable}</span>
                        </span>
                      )}
                      {item.proximaAccion && (
                        <span className="flex items-center gap-1 min-w-0">
                          <ArrowRight size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-500 truncate">Próx: {item.proximaAccion}</span>
                        </span>
                      )}
                    </div>

                    {/* Row 3: Bloqueado (conditional) */}
                    {blocked(item.bloqueadoPor) && (
                      <div className="flex items-center gap-1.5">
                        <Lock size={11} className="text-red-500 shrink-0" />
                        <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 font-medium">
                          Bloqueado por: {item.bloqueadoPor}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              {sec.items.length > 5 && (
                <button className="w-full text-xs text-slate-400 hover:text-blue-600 py-1.5 transition-colors text-center">
                  {sec.items.length - 5} más en esta categoría
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default memo(ModuloMiDia);
