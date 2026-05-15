import { useState } from "react";
import { UserRound } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor } from "../shared/badges";
import { fmtCLP } from "../shared/dataHelpers";
import { ESTADOS_PRACTICANTE } from "../domain/options";
import type { Practicante } from "../domain/types";
import { durMesesEntre, toDDMMYYYY } from "../utils/appHelpers";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

export function ModuloPracticantes({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const filtered = data.practicantes.filter((p: Practicante) => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.area.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const durMeses = (ini: string, fin: string) => ini && fin ? durMesesEntre(ini, fin) : "-";
  const columns = [{ key: "nombre", label: "Nombre" }, { key: "area", label: "Área" }, { key: "especialidad", label: "Especialidad" }, { key: "duracion", label: "Duración (meses)", render: (r: Practicante) => durMeses(r.fechaInicio, r.fechaTermino) }, { key: "costoMensual", label: "Costo/mes", render: (r: Practicante) => fmtCLP(r.costoMensual) }, { key: "costoTotal", label: "Costo total", render: (r: Practicante) => r.fechaInicio && r.fechaTermino ? fmtCLP(r.costoMensual * (durMeses(r.fechaInicio, r.fechaTermino) as number)) : "-" }, { key: "estado", label: "Estado", render: (r: Practicante) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaTermino", label: "Fecha término", render: (r: Practicante) => toDDMMYYYY(r.fechaTermino) }, { key: "semaforo", label: "Semáforo", render: (r: Practicante) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaTermino} /> }, { key: "responsable", label: "Resp.", render: (r: Practicante) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<UserRound size={20} className="text-white" />}
        gradient="from-cyan-400 to-blue-400"
        title="Practicantes"
        subtitle="Control de prácticas profesionales: estado, duración y costos."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar practicante o área..."
        filterPanel={
          <FilterPanel activeCount={[filtroEstado].filter(Boolean).length} onClear={() => { setFiltroEstado(""); }}>
            <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PRACTICANTE} placeholder="Estado" />
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("practicantes")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo practicante</button>}
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("practicantes", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("practicantes", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("practicantes", id, "Finalizado") : undefined}
        closedState="Finalizado"
        emptyMessage="Aún no hay practicantes registrados"
        emptyHint="Crea el primero con «+ Nuevo practicante» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "practicante" : "practicantes"}</p>
    </div>
  );
}
