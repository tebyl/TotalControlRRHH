import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { Badge, SemaforoBadge, prioridadColor } from "../shared/badges";
import { calcReclutamientoAvance } from "../shared/reclutamientoHelpers";
import {
  ESTADOS_PROCESO_RECLUTAMIENTO,
  MESES,
  PLANTAS_CENTROS,
  PRIORIDADES,
  TIPOS_VACANTE,
} from "../domain/options";
import type { ProcesoReclutamiento } from "../domain/types";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, KpiCard as KpiCardUI, ModuleHeader } from "../components/ui";

export function ModuloReclutamiento({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPlanta, setFiltroPlanta] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroReclutador, setFiltroReclutador] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");

  // suppress lint: setFiltroReclutador available for future filter UI
  void setFiltroReclutador;

  const reclutamientos: ProcesoReclutamiento[] = data.reclutamiento || [];

  const total = reclutamientos.length;
  const abiertos = reclutamientos.filter(r => r.proceso === "Abierto").length;
  const cerrados = reclutamientos.filter(r => r.proceso === "Cerrado").length;
  const pausados = reclutamientos.filter(r => r.proceso === "Pausado").length;
  const desistidos = reclutamientos.filter(r => r.proceso === "Desistido").length;
  const bloqueados = reclutamientos.filter(r => !["Cerrado","Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;

  const filtered = reclutamientos.filter(r => {
    if (filtroEstado && r.proceso !== filtroEstado) return false;
    if (filtroPlanta && r.plantaCentro !== filtroPlanta) return false;
    if (filtroTipo && r.tipoVacante !== filtroTipo) return false;
    if (filtroMes && r.mesIngreso !== filtroMes) return false;
    if (filtroReclutador && r.reclutador !== filtroReclutador) return false;
    if (filtroPrioridad && r.prioridad !== filtroPrioridad) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!r.reclutamiento?.toLowerCase().includes(s) &&
          !r.plantaCentro?.toLowerCase().includes(s) &&
          !r.tipoVacante?.toLowerCase().includes(s) &&
          !r.mesIngreso?.toLowerCase().includes(s) &&
          !r.reclutador?.toLowerCase().includes(s) &&
          !r.proceso?.toLowerCase().includes(s) &&
          !r.observaciones?.toLowerCase().includes(s) &&
          !r.proximaAccion?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const columns = [
    { key: "reclutamiento", label: "Tipo recl." },
    { key: "plantaCentro", label: "Planta / Centro" },
    { key: "tipoVacante", label: "Tipo vacante" },
    { key: "mesIngreso", label: "Mes ingreso" },
    { key: "reclutador", label: "Reclutador" },
    { key: "proceso", label: "Proceso", render: (r: ProcesoReclutamiento) => <Badge label={r.proceso} colorClass={r.proceso === "Abierto" ? "bg-green-100 text-green-700" : r.proceso === "Cerrado" ? "bg-slate-200 text-slate-600" : r.proceso === "Pausado" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"} /> },
    { key: "avance", label: "Avance", render: (r: ProcesoReclutamiento) => { const { pct } = calcReclutamientoAvance(r); return <div className="flex items-center gap-2"><div className="w-16 bg-slate-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{width:`${pct}%`}}/></div><span className="text-xs text-slate-600">{pct}%</span></div>; } },
    { key: "etapaActual", label: "Etapa actual", render: (r: ProcesoReclutamiento) => { const { etapaActual } = calcReclutamientoAvance(r); return <span className="text-xs text-slate-600 max-w-[120px] truncate block">{etapaActual}</span>; } },
    { key: "prioridad", label: "Prioridad", render: (r: ProcesoReclutamiento) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> },
    { key: "bloqueadoPor", label: "Bloqueo", render: (r: ProcesoReclutamiento) => r.bloqueadoPor !== "Sin bloqueo" && r.bloqueadoPor ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" },
    { key: "proximaAccion", label: "Próxima acción", render: (r: ProcesoReclutamiento) => <span className="text-xs text-slate-600 max-w-[140px] truncate block">{r.proximaAccion || "-"}</span> },
    { key: "semaforo", label: "Semáforo", render: (r: ProcesoReclutamiento) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaIngreso} /> },
  ];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<UserRoundPlus size={20} className="text-white" />}
        gradient="from-cyan-400 to-blue-400"
        title="Reclutamiento"
        subtitle="Control de procesos de reclutamiento y selección de personal."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por planta, tipo, reclutador..."
        filterPanel={
          <FilterPanel activeCount={(filtroEstado ? 1 : 0) + (filtroPlanta ? 1 : 0) + (filtroTipo ? 1 : 0) + (filtroMes ? 1 : 0) + (filtroPrioridad ? 1 : 0)} onClear={() => { setFiltroEstado(""); setFiltroPlanta(""); setFiltroTipo(""); setFiltroMes(""); setFiltroPrioridad(""); }}>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Proceso</label><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PROCESO_RECLUTAMIENTO} placeholder="Proceso" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Planta / Centro</label><Select value={filtroPlanta} onChange={setFiltroPlanta} options={PLANTAS_CENTROS} placeholder="Planta / Centro" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Tipo vacante</label><Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_VACANTE} placeholder="Tipo vacante" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Mes ingreso</label><Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes ingreso" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Prioridad</label><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></div>
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("reclutamiento")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo proceso</button>}
      />

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", val: total, variant: "default" as const },
          { label: "Abiertos", val: abiertos, variant: "success" as const },
          { label: "Cerrados", val: cerrados, variant: "default" as const },
          { label: "Pausados", val: pausados, variant: "warning" as const },
          { label: "Desistidos", val: desistidos, variant: "danger" as const },
          { label: "Bloqueados", val: bloqueados, variant: bloqueados > 0 ? "danger" as const : "default" as const },
        ].map(k => (
          <KpiCardUI key={k.label} label={k.label} value={k.val} variant={k.variant} />
        ))}
      </div>

      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("reclutamiento", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("reclutamiento", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("reclutamiento", r) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("reclutamiento", id, "Cerrado") : undefined}
        closedState="Cerrado"
        emptyMessage="Aún no hay procesos de reclutamiento"
        emptyHint="Crea el primero con «+ Nuevo proceso» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} de {total} procesos</p>
    </div>
  );
}
