import { memo, useMemo } from "react";
import { AlertTriangle, Award, BookOpen, ClipboardCheck, Clock, FileText, ShieldOff, TrendingUp, Zap } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import type { AppData, ModuloKey, ProcesoReclutamiento } from "../domain/types";
import { isClosedRecord, semaforo, hoy } from "../utils/appHelpers";
import { KpiCard as KpiCardUI, SectionCard } from "../components/ui";

type ModuloInicioProps = {
  data: AppData;
  setActiveModulo: (m: ModuloKey) => void;
  openNew: (modulo: string) => void;
  openCapture: () => void;
  exportXLSX: () => void;
  exportXLSXAnonymized: () => void;
  canExportFull: boolean;
  canExportAnonymized: boolean;
};

function ModuloInicio({
  data,
  setActiveModulo,
  openNew,
  openCapture,
  exportXLSX,
  exportXLSXAnonymized,
  canExportFull,
  canExportAnonymized,
}: ModuloInicioProps) {
  type Modulo = ModuloKey;

  const dashboardData = useMemo(() => {
    const hoyStr = hoy();
    const hace7 = new Date(hoyStr); hace7.setDate(hace7.getDate() - 7); const hace7Str = hace7.toISOString().slice(0, 10);

    const cursosAbiertos = data.cursos.filter(c => !isClosedRecord(c, "cursos")).length;
    const cursosP1 = data.cursos.filter(c => c.prioridad === "P1 Crítico" && !isClosedRecord(c, "cursos")).length;
    const ocsPendientes = data.ocs.filter(o => !isClosedRecord(o, "ocs")).length;
    const diplomasBUK = data.diplomas.filter(d => d.estadoBUK === "Pendiente subir").length;
    const evaluacionesAbiertas = data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).length;
    const procesosBloqueados = data.procesos.filter(p => p.bloqueadoPor !== "Sin bloqueo" && !isClosedRecord(p, "procesos")).length;
    const sinActualizar = [...data.cursos, ...data.procesos, ...data.diplomas, ...data.evaluacionesPsicolaborales].filter((x: any) => x.ultimaActualizacion && x.ultimaActualizacion < hace7Str && !["Cerrado", "Cerrada", "Completado", "Finalizado", "Subido"].includes(x.estado || x.etapa)).length;

    interface ItemBandeja { order: number; tipo: string; nombre: string; prioridad: string; estado: string; bloqueadoPor: string; proximaAccion: string; fechaProximaAccion: string; responsableId: string; modulo: string; }
    const bandeja: ItemBandeja[] = [];

    data.cursos.filter(c => !isClosedRecord(c, "cursos")).forEach(c => {
      const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
      const order = s.label === "Vencido" ? 1 : c.prioridad === "P1 Crítico" ? 2 : c.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : c.ultimaActualizacion && c.ultimaActualizacion < hace7Str ? 8 : c.prioridad === "P2 Alto" ? 9 : 10;
      bandeja.push({ order, tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado, bloqueadoPor: c.bloqueadoPor, proximaAccion: c.proximaAccion, fechaProximaAccion: c.fechaProximaAccion, responsableId: c.responsableId, modulo: "cursos" });
    });
    data.ocs.filter(o => !isClosedRecord(o, "ocs")).forEach(o => {
      const s = semaforo(o.fechaLimite);
      const order = s.label === "Vencido" ? 1 : o.prioridad === "P1 Crítico" ? 2 : o.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : 10;
      bandeja.push({ order, tipo: "OC", nombre: `${o.numeroOC} - ${o.cursoAsociado}`, prioridad: o.prioridad, estado: o.estadoOC, bloqueadoPor: o.bloqueadoPor, proximaAccion: o.accionPendiente, fechaProximaAccion: o.fechaLimite, responsableId: o.responsableId, modulo: "ocs" });
    });
    data.diplomas.filter(d => !isClosedRecord(d, "diplomas")).forEach(d => {
      const s = semaforo(d.fechaProximaAccion);
      const order = d.etapa === "Subir a BUK" && d.estadoBUK === "Pendiente subir" ? 6 : s.label === "Vencido" ? 1 : d.prioridad === "P1 Crítico" ? 2 : d.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : 10;
      bandeja.push({ order, tipo: "Diploma/Cert/Lic", nombre: `${d.tipoDocumento} - ${d.participante}`, prioridad: d.prioridad, estado: d.etapa, bloqueadoPor: d.bloqueadoPor, proximaAccion: d.proximaAccion, fechaProximaAccion: d.fechaProximaAccion, responsableId: d.responsableId, modulo: "diplomas" });
    });
    data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).forEach(e => {
      const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
      const order = s.label === "Vencido" ? 1 : e.prioridad === "P1 Crítico" ? 2 : e.bloqueadoPor !== "Sin bloqueo" ? 3 : e.estado === "Realizada" && e.resultado === "Pendiente" ? 7 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : 10;
      bandeja.push({ order, tipo: "Evaluación Psico", nombre: `${e.cargo} - ${e.candidato}`, prioridad: e.prioridad, estado: e.estado, bloqueadoPor: e.bloqueadoPor, proximaAccion: e.proximaAccion, fechaProximaAccion: e.fechaProximaAccion, responsableId: e.responsableId, modulo: "evaluaciones" });
    });
    data.procesos.filter(p => !isClosedRecord(p, "procesos")).forEach(p => {
      const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
      const order = s.label === "Vencido" ? 1 : p.prioridad === "P1 Crítico" ? 2 : p.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : 10;
      bandeja.push({ order, tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad, estado: p.estadoActual, bloqueadoPor: p.bloqueadoPor, proximaAccion: p.proximaAccion, fechaProximaAccion: p.fechaProximaAccion, responsableId: p.responsableId, modulo: "procesos" });
    });
    (data.reclutamiento || []).filter((r: ProcesoReclutamiento) => !["Cerrado", "Desistido"].includes(r.proceso)).forEach((r: ProcesoReclutamiento) => {
      const fechaRef = r.fechaProximaAccion || r.fechaIngreso;
      const s = semaforo(fechaRef);
      if (s.order <= 3 || r.proceso === "Pausado" || (r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo")) {
        bandeja.push({ order: s.order, tipo: "Reclutamiento", nombre: `${r.reclutamiento || "Proceso"} - ${r.plantaCentro}`, prioridad: r.prioridad, estado: r.proceso, bloqueadoPor: r.bloqueadoPor, proximaAccion: r.proximaAccion, fechaProximaAccion: fechaRef, responsableId: r.reclutadorId, modulo: "reclutamiento" });
      }
    });

    const semaforoVencido = bandeja.filter(b => semaforo(b.fechaProximaAccion).label === "Vencido").length;
    bandeja.sort((a, b) => a.order - b.order);

    return { cursosAbiertos, cursosP1, ocsPendientes, diplomasBUK, evaluacionesAbiertas, procesosBloqueados, sinActualizar, bandeja, semaforoVencido };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">PulsoLaboral</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registra todo el mismo día · Revisa cada mañana · Cierra lo que termines</p>
        </div>
        <button
          onClick={openCapture}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shrink-0"
        >
          <Zap size={14} strokeWidth={2} />
          Captura rápida
        </button>
      </div>

      {/* 3 KPIs héroe */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCardUI size="hero" label="Vencidos sin cerrar" value={dashboardData.semaforoVencido} icon={<AlertTriangle size={22} strokeWidth={2} />} variant={dashboardData.semaforoVencido > 0 ? "danger" : "default"} onClick={() => setActiveModulo("dashboard")} />
        <KpiCardUI size="hero" label="P1 Críticos activos" value={dashboardData.cursosP1} icon={<Zap size={22} strokeWidth={2} />} variant={dashboardData.cursosP1 > 0 ? "danger" : "default"} onClick={() => setActiveModulo("cursos")} />
        <KpiCardUI size="hero" label="Procesos bloqueados" value={dashboardData.procesosBloqueados} icon={<ShieldOff size={22} strokeWidth={2} />} variant={dashboardData.procesosBloqueados > 0 ? "warning" : "default"} onClick={() => setActiveModulo("procesos")} />
      </div>

      {/* Bandeja compacta */}
      {dashboardData.bandeja.length > 0 && (
        <SectionCard
          title={<span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />Lo más urgente</span>}
          subtitle={`${Math.min(dashboardData.bandeja.length, 8)} ítems priorizados de todos los módulos activos`}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" aria-label="Bandeja urgente">
              <thead>
                <tr className="bg-[#f7f8fb] border-b border-slate-100">
                  {["Tipo","Nombre","Prioridad","Estado","Fecha","Módulo"].map(h => (
                    <th key={h} scope="col" className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dashboardData.bandeja.slice(0, 8).map((item, i) => (
                  <tr
                    key={`inicio_${item.modulo}_${i}`}
                    className="hover:bg-[#f7f8fb] transition-colors cursor-pointer"
                    onClick={() => setActiveModulo(item.modulo as Modulo)}
                  >
                    <td className="px-4 py-2.5"><Badge label={item.tipo} colorClass="bg-slate-100 text-slate-600 border border-slate-200" /></td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[220px]"><div className="truncate">{item.nombre}</div></td>
                    <td className="px-4 py-2.5"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td>
                    <td className="px-4 py-2.5"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td>
                    <td className="px-4 py-2.5">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : <span className="text-slate-300 text-xs">—</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-blue-600">{item.modulo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dashboardData.bandeja.length > 8 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <button onClick={() => setActiveModulo("dashboard")} className="text-xs text-blue-600 hover:underline">
                Ver {dashboardData.bandeja.length - 8} más en Dashboard
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {/* Accesos rápidos + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Accesos rápidos">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setActiveModulo("cursos"); openNew("cursos"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium">+ Nuevo curso</button>
            <button onClick={() => { setActiveModulo("ocs"); openNew("ocs"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium">+ Nueva OC</button>
            <button onClick={() => { setActiveModulo("practicantes"); openNew("practicantes"); }} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">+ Practicante</button>
            <button onClick={() => { setActiveModulo("diplomas"); openNew("diplomas"); }} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">+ Diploma</button>
            {(canExportFull || canExportAnonymized) && (
              <button onClick={canExportFull ? exportXLSX : exportXLSXAnonymized} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">Exportar XLSX</button>
            )}
          </div>
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><TrendingUp size={14} className="text-slate-400" />Estado general</span>} noPadding>
          <div className="divide-y divide-slate-50">
            <KpiCardUI size="mini" label="Cursos abiertos" value={dashboardData.cursosAbiertos} icon={<BookOpen size={14} />} variant="info" onClick={() => setActiveModulo("cursos")} />
            <KpiCardUI size="mini" label="OCs pendientes" value={dashboardData.ocsPendientes} icon={<FileText size={14} />} variant={dashboardData.ocsPendientes > 3 ? "warning" : "default"} onClick={() => setActiveModulo("ocs")} />
            <KpiCardUI size="mini" label="Pendientes BUK" value={dashboardData.diplomasBUK} icon={<Award size={14} />} variant={dashboardData.diplomasBUK > 0 ? "danger" : "default"} onClick={() => setActiveModulo("diplomas")} />
            <KpiCardUI size="mini" label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} icon={<ClipboardCheck size={14} />} variant="purple" onClick={() => setActiveModulo("evaluaciones")} />
            <KpiCardUI size="mini" label="Sin actualizar +7d" value={dashboardData.sinActualizar} icon={<Clock size={14} />} variant={dashboardData.sinActualizar > 0 ? "warning" : "default"} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
export default memo(ModuloInicio);
