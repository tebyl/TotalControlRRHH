import { memo, useState } from "react";
import { AlertTriangle, Award } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor, prioridadColor } from "../shared/badges";
import { ESTADOS_BUK, ESTADOS_DIPLOMA, PRIORIDADES } from "../domain/options";
import type { Diploma } from "../domain/types";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

function ModuloDiplomas({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroBUK, setFiltroBUK] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const filtered = data.diplomas.filter((d: Diploma) => {
    if (filtroEtapa && d.etapa !== filtroEtapa) return false;
    if (filtroBUK && d.estadoBUK !== filtroBUK) return false;
    if (filtroPrioridad && d.prioridad !== filtroPrioridad) return false;
    if (search && !d.cursoAsociado.toLowerCase().includes(search.toLowerCase()) && !d.participante.toLowerCase().includes(search.toLowerCase()) && !d.otec.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "cursoAsociado", label: "Curso asociado" }, { key: "participante", label: "Participante" }, { key: "tipoDocumento", label: "Tipo", render: (r: Diploma) => <Badge label={r.tipoDocumento} colorClass="bg-slate-200 text-slate-700" /> }, { key: "otec", label: "OTEC" }, { key: "etapa", label: "Etapa", render: (r: Diploma) => <Badge label={r.etapa} colorClass={estadoColor[r.etapa] || ""} /> }, { key: "estadoBUK", label: "BUK", render: (r: Diploma) => <Badge label={r.estadoBUK} colorClass={estadoColor[r.estadoBUK] || ""} /> }, { key: "prioridad", label: "Prioridad", render: (r: Diploma) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "semaforo", label: "Semáforo", render: (r: Diploma) => <SemaforoBadge fecha={r.fechaProximaAccion} /> }, { key: "responsable", label: "Resp.", render: (r: Diploma) => getResponsableName(data, r.responsableId) }];

  const bukPendientes = data.diplomas.filter((d: Diploma) => d.estadoBUK === "Pendiente subir").length;
  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<Award size={20} className="text-white" />}
        gradient="from-violet-400 to-purple-500"
        title="Diplomas / Certificados / Licencias"
        subtitle="Seguimiento de documentos por etapa: OTEC → Participante → BUK."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar curso, participante u OTEC..."
        filterPanel={
          <FilterPanel activeCount={[filtroEtapa, filtroBUK, filtroPrioridad].filter(Boolean).length} onClear={() => { setFiltroEtapa(""); setFiltroBUK(""); setFiltroPrioridad(""); }}>
            <Select value={filtroEtapa} onChange={setFiltroEtapa} options={ESTADOS_DIPLOMA} placeholder="Etapa" />
            <Select value={filtroBUK} onChange={setFiltroBUK} options={ESTADOS_BUK} placeholder="Estado BUK" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("diplomas")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo documento</button>}
      />
      {bukPendientes > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-800">Atención BUK:</span>
            <span className="text-sm text-red-700 ml-1"><strong>{bukPendientes}</strong> {bukPendientes === 1 ? "documento pendiente" : "documentos pendientes"} de subir a BUK</span>
          </div>
        </div>
      )}
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("diplomas", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("diplomas", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("diplomas", id, "Subido") : undefined}
        closedState="Subido"
        emptyMessage="Aún no hay documentos registrados"
        emptyHint="Crea el primero con «+ Nuevo documento» para hacer seguimiento de diplomas, certificados y licencias."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "documento" : "documentos"}</p>
    </div>
  );
}
export default memo(ModuloDiplomas);
