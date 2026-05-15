import { memo, useState } from "react";
import { Hourglass } from "lucide-react";
import { Badge, SemaforoBadge, prioridadColor } from "../shared/badges";
import { PRIORIDADES, TIPOS_PROCESO } from "../domain/options";
import type { Proceso } from "../domain/types";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

function ModuloProcesos({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName, tableLoading }: any) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const filtered = data.procesos.filter((p: Proceso) => {
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (filtroPrioridad && p.prioridad !== filtroPrioridad) return false;
    if (search && !p.proceso.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "proceso", label: "Proceso" }, { key: "tipo", label: "Tipo", render: (r: Proceso) => <Badge label={r.tipo} colorClass="bg-slate-200 text-slate-700" /> }, { key: "estadoActual", label: "Estado" }, { key: "queFalta", label: "Qué falta" }, { key: "prioridad", label: "Prioridad", render: (r: Proceso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "riesgo", label: "Riesgo", render: (r: Proceso) => r.riesgo ? <span className="text-red-600 text-xs">{r.riesgo}</span> : "-" }, { key: "semaforo", label: "Semáforo", render: (r: Proceso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaLimite} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Proceso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Proceso) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<Hourglass size={20} className="text-white" />}
        gradient="from-amber-400 to-orange-500"
        title="Procesos Pendientes"
        subtitle="Seguimiento de procesos transversales, riesgos y bloqueos."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar proceso..."
        filterPanel={
          <FilterPanel activeCount={[filtroTipo, filtroPrioridad].filter(Boolean).length} onClear={() => { setFiltroTipo(""); setFiltroPrioridad(""); }}>
            <Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_PROCESO} placeholder="Tipo" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("procesos")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo proceso</button>}
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("procesos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("procesos", id) : undefined}
        emptyMessage="Aún no hay procesos pendientes"
        emptyHint="Crea el primero con «+ Nuevo proceso» para llevar un seguimiento formal."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "proceso" : "procesos"}</p>
    </div>
  );
}
export default memo(ModuloProcesos);
