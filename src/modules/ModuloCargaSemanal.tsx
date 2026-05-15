import { memo } from "react";
import { CalendarRange } from "lucide-react";
import type { AppData, CargaSemanal } from "../domain/types";
import { DataTable as Table } from "../components/tables/DataTable";
import { ModuleHeader } from "../components/ui";

type Props = {
  data: AppData;
  search: string;
  setSearch: (v: string) => void;
  openNew: (modulo: string) => void;
  openEdit: (modulo: string, item: any) => void;
  deleteItem?: (modulo: string, id: string) => void;
  duplicateItem?: (modulo: string, item: any) => void;
  tableLoading?: boolean;
};

function ModuloCargaSemanal({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, tableLoading }: Props) {
  const filtered = data.cargaSemanal.filter((c: CargaSemanal) => {
    if (search && !c.semana.toLowerCase().includes(search.toLowerCase()) && !c.comentario.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: "semana", label: "Semana" },
    { key: "cursosPlanificados", label: "Planificados" },
    { key: "cursosUrgentesNuevos", label: "Urgentes nuevos" },
    { key: "cursosNoPlanificados", label: "No planificados" },
    { key: "ocsNuevas", label: "OCs nuevas" },
    { key: "diplomasPendientes", label: "Diplomas pend." },
    { key: "procesosBloqueados", label: "Proc. bloqueados" },
    { key: "comentario", label: "Comentario" },
  ];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<CalendarRange size={20} className="text-white" />}
        gradient="from-emerald-400 to-teal-500"
        title="Carga Semanal"
        subtitle="Registro de carga operativa real vs planificada por semana."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar semana..."
        actions={
          <button onClick={() => openNew("cargaSemanal")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            + Nueva semana
          </button>
        }
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("cargaSemanal", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("cargaSemanal", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("cargaSemanal", r) : undefined}
        emptyMessage="Aún no hay semanas registradas"
        emptyHint="Registra la primera semana para llevar estadísticas de carga operativa."
      />
      <p className="text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "semana registrada" : "semanas registradas"}</p>
    </div>
  );
}

export default memo(ModuloCargaSemanal);
