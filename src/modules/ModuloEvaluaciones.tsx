import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import { fmtCLP } from "../shared/dataHelpers";
import { ESTADOS_EVALUACION, MESES, PRIORIDADES, RESULTADOS_EVALUACION } from "../domain/options";
import type { Evaluacion } from "../domain/types";
import { toDDMMYYYY } from "../utils/appHelpers";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

export function ModuloEvaluaciones({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed: _markClosed, getResponsableName, tableLoading }: any) {
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");

  const filtered = data.evaluacionesPsicolaborales.filter((e: Evaluacion) => {
    if (filtroMes && e.mes !== filtroMes) return false;
    if (filtroAno && e.ano !== parseInt(filtroAno)) return false;
    if (filtroEstado && e.estado !== filtroEstado) return false;
    if (filtroResultado && e.resultado !== filtroResultado) return false;
    if (filtroPrioridad && e.prioridad !== filtroPrioridad) return false;
    if (search && !e.cargo.toLowerCase().includes(search.toLowerCase()) && !e.candidato.toLowerCase().includes(search.toLowerCase()) && !e.proveedor.toLowerCase().includes(search.toLowerCase()) && !e.area.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: "mes", label: "Mes" },
    { key: "ano", label: "Año" },
    { key: "cargo", label: "Cargo" },
    { key: "area", label: "Área" },
    { key: "candidato", label: "Candidato" },
    { key: "tipoEvaluacion", label: "Tipo", render: (r: Evaluacion) => <Badge label={r.tipoEvaluacion} colorClass="bg-slate-200 text-slate-700" /> },
    { key: "estado", label: "Estado", render: (r: Evaluacion) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> },
    { key: "resultado", label: "Resultado", render: (r: Evaluacion) => <Badge label={r.resultado} colorClass={estadoColor[r.resultado] || ""} /> },
    { key: "prioridad", label: "Prioridad", render: (r: Evaluacion) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> },
    { key: "fechaEntregaInforme", label: "Entrega informe", render: (r: Evaluacion) => toDDMMYYYY(r.fechaEntregaInforme) },
    { key: "semaforo", label: "Semáforo", render: (r: Evaluacion) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaEntregaInforme} /> },
    { key: "bloqueadoPor", label: "Bloqueo", render: (r: Evaluacion) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" },
    { key: "costo", label: "Costo", render: (r: Evaluacion) => fmtCLP(r.costo) },
    { key: "responsable", label: "Resp.", render: (r: Evaluacion) => getResponsableName(data, r.responsableId) },
  ];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<ClipboardCheck size={20} className="text-white" />}
        gradient="from-cyan-400 to-blue-400"
        title="Evaluaciones Psicolaborales"
        subtitle="Control de evaluaciones por candidato, cargo, estado y resultado."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cargo, candidato o área..."
        filterPanel={
          <FilterPanel activeCount={[filtroMes, filtroAno, filtroEstado, filtroResultado, filtroPrioridad].filter(Boolean).length} onClear={() => { setFiltroMes(""); setFiltroAno(""); setFiltroEstado(""); setFiltroResultado(""); setFiltroPrioridad(""); }}>
            <Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes" />
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 w-full focus:outline-none focus:border-blue-300 transition-colors">
              <option value="">Año</option><option value="2026">2026</option><option value="2025">2025</option>
            </select>
            <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_EVALUACION} placeholder="Estado" />
            <Select value={filtroResultado} onChange={setFiltroResultado} options={RESULTADOS_EVALUACION} placeholder="Resultado" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("evaluaciones")} className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm">+ Nueva evaluación</button>}
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("evaluaciones", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("evaluacionesPsicolaborales", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("evaluacionesPsicolaborales", r) : undefined}
        emptyMessage="Aún no hay evaluaciones registradas"
        emptyHint="Crea la primera con «+ Nueva evaluación» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "evaluación" : "evaluaciones"}</p>
    </div>
  );
}
