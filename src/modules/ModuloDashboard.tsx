import React, { Suspense } from "react";
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
import type { AppData, ModuloKey } from "../domain/types";
import { KpiCard as KpiCardUI, ModuleHeader, SectionCard, SkeletonCard } from "../components/ui";

const ChartsPanel = React.lazy(() => import("../components/dashboard/ChartsPanel"));

type Modulo = ModuloKey;

type ModuloDashboardProps = {
  data: AppData;
  dashboardData: any;
  chartCursosPorPrioridad: ChartData<"doughnut", number[], string>;
  chartEvaluacionesPorEstado: ChartData<"doughnut", number[], string>;
  chartPresupuesto: ChartData<"bar", number[], string>;
  reporteMensual: React.ReactNode;
  setActiveModulo: (m: ModuloKey) => void;
};

export function ModuloDashboard({
  data,
  dashboardData,
  chartCursosPorPrioridad,
  chartEvaluacionesPorEstado,
  chartPresupuesto,
  reporteMensual,
  setActiveModulo,
}: ModuloDashboardProps) {
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
