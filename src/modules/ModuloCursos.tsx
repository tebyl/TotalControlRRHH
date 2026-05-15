import { memo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import { FilterBar } from "../shared/filterBar";
import { ESTADOS_CURSO, ORIGENES_CURSO, PRIORIDADES } from "../domain/options";
import type { Curso } from "../domain/types";
import { semaforo, toDDMMYYYY } from "../utils/appHelpers";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { PageHeader } from "../components/ui";

function ModuloCursos({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [filtroSemaforo, setFiltroSemaforo] = useState("");

  const filtered = data.cursos.filter((c: Curso) => {
    if (filtroPrioridad && c.prioridad !== filtroPrioridad) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroOrigen && c.origen !== filtroOrigen) return false;
    if (filtroSemaforo) { const s = semaforo(c.fechaProximaAccion || c.fechaRequerida); if (s.label !== filtroSemaforo) return false; }
    if (search && !c.curso.toLowerCase().includes(search.toLowerCase()) && !c.proveedor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [{ key: "curso", label: "Curso" }, { key: "origen", label: "Origen", render: (r: Curso) => <Badge label={r.origen} colorClass="bg-slate-200 text-slate-700" /> }, { key: "prioridad", label: "Prioridad", render: (r: Curso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "estado", label: "Estado", render: (r: Curso) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaRequerida", label: "Fecha req.", render: (r: Curso) => toDDMMYYYY(r.fechaRequerida) }, { key: "semaforo", label: "Semáforo", render: (r: Curso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaRequerida} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Curso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Curso) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<GraduationCap size={18} />}
        iconColor="text-amber-500"
        title="Cursos / DNC"
        subtitle="Control de cursos y capacitaciones planificadas y emergentes."
        actions={<button onClick={() => openNew("cursos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Agregar nuevo</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso o proveedor..." filters={<><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_CURSO} placeholder="Estado" /><Select value={filtroOrigen} onChange={setFiltroOrigen} options={ORIGENES_CURSO} placeholder="Origen" /><Select value={filtroSemaforo} onChange={setFiltroSemaforo} options={["Vencido", "Vence hoy", "1-3 días", "4-7 días", "Sin urgencia", "Sin fecha"]} placeholder="Semáforo" /></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("cursos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("cursos", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("cursos", id, "Cerrado") : undefined}
        closedState="Cerrado"
        emptyMessage="Aún no hay cursos registrados"
        emptyHint="Crea el primero con «+ Agregar nuevo» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "curso" : "cursos"}</p>
    </div>
  );
}
export default memo(ModuloCursos);
