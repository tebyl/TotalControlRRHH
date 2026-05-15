import React, { memo, Suspense, useMemo } from "react";
import type { ChartData } from "chart.js";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Fuel,
  GraduationCap,
  LayoutDashboard,
  Package,
  ShieldOff,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import { SemaforoItem } from "../shared/filterBar";
import { getResponsableName } from "../shared/dataHelpers";
import type { AppData, ModuloKey, ProcesoReclutamiento } from "../domain/types";
import { isClosedRecord, semaforo, hoy } from "../utils/appHelpers";
import { KpiCard as KpiCardUI, ModuleHeader, SectionCard, SkeletonCard } from "../components/ui";

const ChartsPanel = React.lazy(() => import("../components/dashboard/ChartsPanel"));

type Modulo = ModuloKey;

type ModuloDashboardProps = {
  data: AppData;
  reporteMensual: React.ReactNode;
  setActiveModulo: (m: ModuloKey) => void;
};

function ModuloDashboard({ data, reporteMensual, setActiveModulo }: ModuloDashboardProps) {
  const dashboardData = useMemo(() => {
    const hoyStr = hoy();
    const hace7 = new Date(hoyStr); hace7.setDate(hace7.getDate() - 7); const hace7Str = hace7.toISOString().slice(0, 10);

    const cursosAbiertos = data.cursos.filter(c => !isClosedRecord(c, "cursos")).length;
    const cursosP1 = data.cursos.filter(c => c.prioridad === "P1 Crítico" && !isClosedRecord(c, "cursos")).length;
    const ocsPendientes = data.ocs.filter(o => !isClosedRecord(o, "ocs")).length;
    const diplomasBUK = data.diplomas.filter(d => d.estadoBUK === "Pendiente subir").length;
    const evaluacionesAbiertas = data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).length;
    const evaluacionesInformePendiente = data.evaluacionesPsicolaborales.filter(e => e.estado === "Realizada" && e.resultado === "Pendiente").length;
    const presupuestoUsado = data.presupuesto.reduce((s, p) => s + p.gastado, 0);
    const presupuestoTotal = data.presupuesto.reduce((s, p) => s + p.presupuestoTotal, 0);
    const procesosBloqueados = data.procesos.filter(p => p.bloqueadoPor !== "Sin bloqueo" && !isClosedRecord(p, "procesos")).length;
    const sinActualizar = [...data.cursos, ...data.procesos, ...data.diplomas, ...data.evaluacionesPsicolaborales].filter((x: any) => x.ultimaActualizacion && x.ultimaActualizacion < hace7Str && !["Cerrado", "Cerrada", "Completado", "Finalizado", "Subido"].includes(x.estado || x.etapa)).length;
    const valesGasActivos = (data.valesGas || []).filter(v => v.estado !== "Cerrado" && v.estado !== "Detenido").length;
    const valesGasEnDescuento = (data.valesGas || []).filter(v => v.estado === "En descuento").length;
    const valesGasSaldoTotal = (data.valesGas || []).reduce((s, v) => s + (v.saldoVales || 0), 0);
    const valesGasVencidos = (data.valesGas || []).filter(v => v.fechaProximaRevision && semaforo(v.fechaProximaRevision).label === "Vencido" && v.estado !== "Cerrado").length;
    const valesGasStockOrg = (data.valesGasOrganizacion || []).reduce((s, v) => v.tipoMovimiento === "Ajuste negativo" ? s - (v.cantidadVales || 0) : s + (v.cantidadVales || 0), 0);
    const valesGasAsignados = (data.valesGas || []).reduce((s, v) => s + (v.totalValesAsignados || 0), 0);
    const valesGasSaldoOrg = valesGasStockOrg - valesGasAsignados;

    interface ItemBandeja { order: number; tipo: string; nombre: string; prioridad: string; estado: string; bloqueadoPor: string; proximaAccion: string; fechaProximaAccion: string; responsableId: string; modulo: string; id?: string; }
    const bandeja: ItemBandeja[] = [];

    data.cursos.filter(c => !isClosedRecord(c, "cursos")).forEach(c => {
      const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
      const order = s.label === "Vencido" ? 1 : c.prioridad === "P1 Crítico" ? 2 : c.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : c.ultimaActualizacion && c.ultimaActualizacion < hace7Str ? 8 : c.prioridad === "P2 Alto" ? 9 : c.prioridad === "P3 Medio" ? 10 : 11;
      bandeja.push({ order, tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado, bloqueadoPor: c.bloqueadoPor, proximaAccion: c.proximaAccion, fechaProximaAccion: c.fechaProximaAccion, responsableId: c.responsableId, modulo: "cursos" });
    });
    data.ocs.filter(o => !isClosedRecord(o, "ocs")).forEach(o => {
      const s = semaforo(o.fechaLimite);
      const order = s.label === "Vencido" ? 1 : o.prioridad === "P1 Crítico" ? 2 : o.bloqueadoPor !== "Sin bloqueo" ? 3 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 5 : o.ultimaActualizacion && o.ultimaActualizacion < hace7Str ? 8 : 10;
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
    (data.valesGas || []).filter(v => v.estado !== "Cerrado" && v.estado !== "Detenido").forEach(v => {
      const s = semaforo(v.fechaProximaRevision);
      const order = s.label === "Vencido" ? 1 : v.estado === "En descuento" ? 5 : s.label === "Vence hoy" ? 4 : s.label === "1-3 días" ? 6 : 11;
      bandeja.push({ order, tipo: "Vale Gas", nombre: `${v.colaborador} - ${v.periodo}`, prioridad: "P3 Medio", estado: v.estado, bloqueadoPor: "Sin bloqueo", proximaAccion: v.observaciones || "", fechaProximaAccion: v.fechaProximaRevision, responsableId: v.responsableId, modulo: "valesGas" });
    });
    (data.reclutamiento || []).filter((r: ProcesoReclutamiento) => !["Cerrado", "Desistido"].includes(r.proceso)).forEach((r: ProcesoReclutamiento) => {
      const fechaRef = r.fechaProximaAccion || r.fechaIngreso;
      const s = semaforo(fechaRef);
      const order = s.order + (r.prioridad === "P1 Crítico" ? -0.5 : 0);
      if (s.order <= 3 || r.proceso === "Pausado" || (r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo")) {
        bandeja.push({ order, tipo: "Reclutamiento", nombre: `${r.reclutamiento || "Proceso"} - ${r.plantaCentro}`, prioridad: r.prioridad, estado: r.proceso, bloqueadoPor: r.bloqueadoPor, proximaAccion: r.proximaAccion, fechaProximaAccion: fechaRef, responsableId: r.reclutadorId, modulo: "reclutamiento" });
      }
    });

    const reclAbiertos = (data.reclutamiento || []).filter((r: any) => r.proceso === "Abierto").length;
    const reclPausados = (data.reclutamiento || []).filter((r: any) => r.proceso === "Pausado").length;
    const reclBloqueados = (data.reclutamiento || []).filter((r: any) => !["Cerrado","Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;
    const reclSinReclutador = (data.reclutamiento || []).filter((r: any) => !r.reclutador && !r.reclutadorId).length;
    const hoy7 = new Date(); hoy7.setDate(hoy7.getDate() + 7);
    const reclIngresosProximos = (data.reclutamiento || []).filter((r: any) => { if (!r.fechaIngreso) return false; const df = new Date(r.fechaIngreso); return df >= new Date() && df <= hoy7; }).length;

    bandeja.sort((a, b) => a.order - b.order);

    const semaforoCounts = { vencido: 0, venceHoy: 0, unoATres: 0, cuatroASiete: 0, sinUrgencia: 0, sinFecha: 0 };
    const allItems = [...data.cursos.filter(c => !isClosedRecord(c, "cursos")).map(c => c.fechaProximaAccion || c.fechaRequerida), ...data.ocs.filter(o => !isClosedRecord(o, "ocs")).map(o => o.fechaLimite), ...data.diplomas.map(d => d.fechaProximaAccion), ...data.procesos.map(p => p.fechaProximaAccion || p.fechaLimite), ...data.evaluacionesPsicolaborales.map(e => e.fechaProximaAccion || e.fechaEntregaInforme)];
    allItems.forEach(f => {
      const s = semaforo(f);
      if (s.label === "Vencido") semaforoCounts.vencido++;
      else if (s.label === "Vence hoy") semaforoCounts.venceHoy++;
      else if (s.label === "1-3 días") semaforoCounts.unoATres++;
      else if (s.label === "4-7 días") semaforoCounts.cuatroASiete++;
      else if (s.label === "Sin urgencia") semaforoCounts.sinUrgencia++;
      else semaforoCounts.sinFecha++;
    });

    return { cursosAbiertos, cursosP1, ocsPendientes, diplomasBUK, evaluacionesAbiertas, evaluacionesInformePendiente, presupuestoUsado, presupuestoTotal, procesosBloqueados, sinActualizar, bandeja, semaforoCounts, valesGasActivos, valesGasEnDescuento, valesGasSaldoTotal, valesGasVencidos, valesGasStockOrg, valesGasAsignados, valesGasSaldoOrg, reclAbiertos, reclPausados, reclBloqueados, reclSinReclutador, reclIngresosProximos };
  }, [data]);

  const chartCursosPorPrioridad = useMemo((): ChartData<"doughnut", number[], string> => {
    const counts: Record<string, number> = { "P1 Crítico": 0, "P2 Alto": 0, "P3 Medio": 0, "P4 Bajo": 0 };
    data.cursos.filter(c => c.estado !== "Cerrado").forEach(c => { if (counts[c.prioridad] !== undefined) counts[c.prioridad]++; });
    return { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ["#DC2626", "#EA580C", "#F59E0B", "#16A34A"] }] };
  }, [data]);

  const chartEvaluacionesPorEstado = useMemo((): ChartData<"doughnut", number[], string> => {
    const map: Record<string, number> = {};
    data.evaluacionesPsicolaborales.forEach(e => { map[e.estado] = (map[e.estado] || 0) + 1; });
    return { labels: Object.keys(map), datasets: [{ data: Object.values(map), backgroundColor: ["#9CA3AF", "#3B82F6", "#60A5FA", "#8B5CF6", "#14B8A6", "#F59E0B", "#16A34A", "#6B7280"] }] };
  }, [data]);

  const chartPresupuesto = useMemo((): ChartData<"bar", number[], string> => {
    return { labels: data.presupuesto.map(p => p.concepto), datasets: [{ label: "Gastado", data: data.presupuesto.map(p => p.gastado), backgroundColor: "#DC2626" }, { label: "Disponible", data: data.presupuesto.map(p => p.presupuestoTotal - p.gastado), backgroundColor: "#16A34A" }] };
  }, [data]);

  return (
          <div className="space-y-6">
            <ModuleHeader
              icon={<LayoutDashboard size={20} className="text-white" />}
              gradient="from-blue-500 to-indigo-600"
              title="Dashboard"
              subtitle="Vista centralizada de estado operacional, alertas y prioridades."
            />

            {/* 3 KPIs héroe — críticos */}
            <div className="grid grid-cols-3 gap-4">
              <KpiCardUI size="hero" label="Vencidos sin cerrar" value={dashboardData.semaforoCounts.vencido} icon={<AlertTriangle size={22} strokeWidth={2} />} variant={dashboardData.semaforoCounts.vencido > 0 ? "danger" : "default"} description="Requieren acción inmediata" />
              <KpiCardUI size="hero" label="P1 Críticos activos" value={dashboardData.cursosP1} icon={<Zap size={22} strokeWidth={2} />} variant={dashboardData.cursosP1 > 0 ? "danger" : "default"} description="Prioridad máxima" onClick={() => setActiveModulo("cursos")} />
              <KpiCardUI size="hero" label="Procesos bloqueados" value={dashboardData.procesosBloqueados} icon={<ShieldOff size={22} strokeWidth={2} />} variant={dashboardData.procesosBloqueados > 0 ? "warning" : "default"} description="Con bloqueo activo" onClick={() => setActiveModulo("procesos")} />
            </div>

            {/* Stats secundarios en tabla compacta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title={<span className="flex items-center gap-2"><GraduationCap size={14} className="text-amber-500" />Operacional</span>} noPadding>
                <div className="divide-y divide-slate-50">
                  <KpiCardUI size="mini" label="Cursos abiertos" value={dashboardData.cursosAbiertos} icon={<BookOpen size={14} />} variant="info" onClick={() => setActiveModulo("cursos")} />
                  <KpiCardUI size="mini" label="OCs pendientes" value={dashboardData.ocsPendientes} icon={<FileText size={14} />} variant={dashboardData.ocsPendientes > 3 ? "warning" : "default"} onClick={() => setActiveModulo("ocs")} />
                  <KpiCardUI size="mini" label="Pendientes BUK" value={dashboardData.diplomasBUK} icon={<Award size={14} />} variant={dashboardData.diplomasBUK > 0 ? "danger" : "default"} onClick={() => setActiveModulo("diplomas")} />
                  <KpiCardUI size="mini" label="Sin actualizar +7d" value={dashboardData.sinActualizar} icon={<Clock size={14} />} variant={dashboardData.sinActualizar > 0 ? "warning" : "default"} />
                  <KpiCardUI size="mini" label="Informe psico pendiente" value={dashboardData.evaluacionesInformePendiente} icon={<ClipboardCheck size={14} />} variant={dashboardData.evaluacionesInformePendiente > 0 ? "warning" : "default"} onClick={() => setActiveModulo("evaluaciones")} />
                  <KpiCardUI size="mini" label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} icon={<ClipboardCheck size={14} />} variant="purple" onClick={() => setActiveModulo("evaluaciones")} />
                </div>
              </SectionCard>
              <SectionCard title={<span className="flex items-center gap-2"><Fuel size={14} className="text-emerald-500" />Finanzas &amp; Reclutamiento</span>} noPadding>
                <div className="divide-y divide-slate-50">
                  <KpiCardUI size="mini" label="Stock vales organización" value={dashboardData.valesGasStockOrg} icon={<Fuel size={14} />} variant="info" onClick={() => setActiveModulo("valesGas")} />
                  <KpiCardUI size="mini" label="Saldo disponible vales" value={dashboardData.valesGasSaldoOrg} icon={<Package size={14} />} variant={dashboardData.valesGasSaldoOrg < 0 ? "danger" : "default"} onClick={() => setActiveModulo("valesGas")} />
                  <KpiCardUI size="mini" label="Vales en descuento" value={dashboardData.valesGasEnDescuento} icon={<Wallet size={14} />} variant={dashboardData.valesGasEnDescuento > 0 ? "warning" : "default"} onClick={() => setActiveModulo("valesGas")} />
                  <KpiCardUI size="mini" label="Reclut. procesos abiertos" value={dashboardData.reclAbiertos} icon={<Users size={14} />} variant="info" onClick={() => setActiveModulo("reclutamiento")} />
                  <KpiCardUI size="mini" label="Reclut. bloqueados" value={dashboardData.reclBloqueados} icon={<ShieldOff size={14} />} variant={dashboardData.reclBloqueados > 0 ? "danger" : "default"} onClick={() => setActiveModulo("reclutamiento")} />
                  <KpiCardUI size="mini" label="Ingresos próximos 7d" value={dashboardData.reclIngresosProximos} icon={<CalendarRange size={14} />} variant={dashboardData.reclIngresosProximos > 0 ? "info" : "default"} onClick={() => setActiveModulo("reclutamiento")} />
                </div>
              </SectionCard>
            </div>

            {/* Semáforo general */}
            <SectionCard title={<span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-400" />Semáforo general</span>} subtitle="Distribución de urgencias por fecha próxima acción">
              <div className="flex flex-wrap gap-3">
                <SemaforoItem color="#DC2626" label="Vencido" count={dashboardData.semaforoCounts.vencido} />
                <SemaforoItem color="#EA580C" label="Vence hoy" count={dashboardData.semaforoCounts.venceHoy} />
                <SemaforoItem color="#F59E0B" label="1-3 días" count={dashboardData.semaforoCounts.unoATres} />
                <SemaforoItem color="#FBBF24" label="4-7 días" count={dashboardData.semaforoCounts.cuatroASiete} />
                <SemaforoItem color="#16A34A" label="Sin urgencia" count={dashboardData.semaforoCounts.sinUrgencia} />
                <SemaforoItem color="#9CA3AF" label="Sin fecha" count={dashboardData.semaforoCounts.sinFecha} />
              </div>
            </SectionCard>

            {/* Bandeja de acción */}
            <SectionCard title={<span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />Bandeja de acción priorizada</span>} subtitle="Los 20 ítems más urgentes de todos los módulos activos" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" aria-label="Bandeja de acción priorizada">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["#","Tipo","Nombre / Proceso","Prioridad","Estado","Bloqueado por","Próxima acción","Fecha","Responsable","Módulo"].map(h => (
                        <th key={h} scope="col" className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.bandeja.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                            <CheckCircle2 size={40} className="mb-3 text-emerald-500 opacity-70" />
                            <p className="text-sm font-medium text-slate-500 mb-1">Sin ítems urgentes por ahora</p>
                            <p className="text-xs text-slate-400">Cuando haya pendientes críticos o próximos a vencer aparecerán aquí.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dashboardData.bandeja.slice(0, 20).map((item: any, i: number) => (
                        <tr
                          key={`${item.modulo}_${item.id || i}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`Ir a ${item.nombre} en módulo ${item.modulo}`}
                          className={`border-t border-slate-100 hover:bg-blue-50/50 focus:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                          onClick={() => setActiveModulo(item.modulo as Modulo)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveModulo(item.modulo as Modulo); } }}
                        >
                          <td className="px-3 py-2.5 text-xs text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-3 py-2.5"><Badge label={item.tipo} colorClass="bg-slate-100 text-slate-600 border border-slate-200" /></td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[200px]"><div className="truncate">{item.nombre}</div></td>
                          <td className="px-3 py-2.5"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td>
                          <td className="px-3 py-2.5"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td>
                          <td className="px-3 py-2.5">{item.bloqueadoPor !== "Sin bloqueo" ? <Badge label={item.bloqueadoPor} colorClass="bg-red-100 text-red-700 border border-red-200" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[160px]"><div className="truncate">{item.proximaAccion || "—"}</div></td>
                          <td className="px-3 py-2.5">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : <span className="text-slate-300">—</span>}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{getResponsableName(data, item.responsableId)}</td>
                          <td className="px-3 py-2.5"><span className="text-xs text-blue-600 underline">{item.modulo}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Gráficos */}
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }
            >
              <ChartsPanel
                chartCursosPorPrioridad={chartCursosPorPrioridad}
                chartEvaluacionesPorEstado={chartEvaluacionesPorEstado}
                chartPresupuesto={chartPresupuesto}
              />
            </Suspense>

            {/* Reporte Mensual Ejecutivo */}
            <div className="border-t border-slate-200 pt-6">
              {reporteMensual}
            </div>
          </div>
  );
}
export default memo(ModuloDashboard);
