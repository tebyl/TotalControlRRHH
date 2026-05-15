import { memo, useState } from "react";
import { FileText } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import { fmtCLP } from "../shared/dataHelpers";
import { CATEGORIAS_OC, ESTADOS_OC, PRIORIDADES } from "../domain/options";
import type { OC } from "../domain/types";
import { toDDMMYYYY } from "../utils/appHelpers";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

function ModuloOCs({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const filtered = data.ocs.filter((o: OC) => {
    if (filtroEstado && o.estadoOC !== filtroEstado) return false;
    if (filtroPrioridad && o.prioridad !== filtroPrioridad) return false;
    if (filtroCategoria && o.categoriaOC !== filtroCategoria) return false;
    if (search && !o.numeroOC.toLowerCase().includes(search.toLowerCase()) && !o.cursoAsociado.toLowerCase().includes(search.toLowerCase()) && !o.proveedor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "numeroOC", label: "N° OC", render: (r: OC) => <span className="font-semibold">{r.numeroOC}</span> }, { key: "categoriaOC", label: "Categoría", render: (r: OC) => r.categoriaOC ? <Badge label={r.categoriaOC} colorClass="bg-indigo-100 text-indigo-700" /> : <span className="text-slate-400 text-xs">-</span> }, { key: "cursoAsociado", label: "Curso / Servicio" }, { key: "proveedor", label: "Proveedor" }, { key: "monto", label: "Monto", render: (r: OC) => fmtCLP(r.monto) }, { key: "estadoOC", label: "Estado", render: (r: OC) => <Badge label={r.estadoOC} colorClass={estadoColor[r.estadoOC] || ""} /> }, { key: "prioridad", label: "Prioridad", render: (r: OC) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "fechaLimite", label: "Fecha límite", render: (r: OC) => toDDMMYYYY(r.fechaLimite) }, { key: "semaforo", label: "Semáforo", render: (r: OC) => <SemaforoBadge fecha={r.fechaLimite} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: OC) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: OC) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<FileText size={20} className="text-white" />}
        gradient="from-amber-400 to-orange-500"
        title="OCs Pendientes"
        subtitle="Seguimiento de órdenes de compra por categoría, estado y monto."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar OC, curso o proveedor..."
        filterPanel={
          <FilterPanel activeCount={[filtroCategoria, filtroEstado, filtroPrioridad].filter(Boolean).length} onClear={() => { setFiltroCategoria(""); setFiltroEstado(""); setFiltroPrioridad(""); }}>
            <Select value={filtroCategoria} onChange={setFiltroCategoria} options={CATEGORIAS_OC} placeholder="Categoría" />
            <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_OC} placeholder="Estado" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("ocs")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nueva OC</button>}
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("ocs", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("ocs", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("ocs", id, "Cerrada") : undefined}
        closedState="Cerrada"
        emptyMessage="Aún no hay OCs registradas"
        emptyHint="Crea la primera con «+ Nueva OC» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "OC" : "OCs"}</p>
    </div>
  );
}
export default memo(ModuloOCs);
