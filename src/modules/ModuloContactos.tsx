import { useState } from "react";
import { ContactRound, Info } from "lucide-react";
import { Badge } from "../shared/badges";
import { RELACIONES } from "../domain/options";
import type { Contacto } from "../domain/types";
import { Select } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

export function ModuloContactos({ data, search, setSearch, openNew, openEdit, deleteItem, tableLoading }: any) {
  const [filtroRelacion, setFiltroRelacion] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const filtered = data.contactos.filter((c: Contacto) => {
    if (filtroRelacion && c.relacion !== filtroRelacion) return false;
    if (filtroActivo && c.activo !== filtroActivo) return false;
    if (search && !c.nombre.toLowerCase().includes(search.toLowerCase()) && !c.rol.toLowerCase().includes(search.toLowerCase()) && !c.areaEmpresa.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "nombre", label: "Nombre", render: (r: Contacto) => <span className="font-semibold">{r.nombre}</span> }, { key: "rol", label: "Rol" }, { key: "areaEmpresa", label: "Área / Empresa" }, { key: "correo", label: "Correo" }, { key: "telefono", label: "Teléfono" }, { key: "relacion", label: "Relación", render: (r: Contacto) => <Badge label={r.relacion} colorClass="bg-slate-200 text-slate-700" /> }, { key: "activo", label: "Activo", render: (r: Contacto) => <Badge label={r.activo} colorClass={r.activo === "Sí" ? "bg-green-500 text-white" : "bg-gray-400 text-white"} /> }];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<ContactRound size={20} className="text-white" />}
        gradient="from-cyan-400 to-blue-400"
        title="Contactos / Responsables"
        subtitle="Base de personas: internos, OTEC, jefaturas, psicólogos y proveedores."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar contacto..."
        filterPanel={
          <FilterPanel activeCount={[filtroRelacion, filtroActivo].filter(Boolean).length} onClear={() => { setFiltroRelacion(""); setFiltroActivo(""); }}>
            <Select value={filtroRelacion} onChange={setFiltroRelacion} options={RELACIONES} placeholder="Relación" />
            <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 w-full focus:outline-none focus:border-blue-300 transition-colors">
              <option value="">Activo (todos)</option><option value="Sí">Sí</option><option value="No">No</option>
            </select>
          </FilterPanel>
        }
        actions={<button onClick={() => openNew("contactos")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo contacto</button>}
      />
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">Todos los responsables de los módulos se asignan desde aquí. <strong>Crea el contacto antes de asignarlo</strong> en cualquier registro.</p>
      </div>
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("contactos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("contactos", id) : undefined}
        emptyMessage="Aún no hay contactos registrados"
        emptyHint="Crea el primero con «+ Nuevo contacto». Los responsables de todos los módulos se asignan desde aquí."
      />
      <p className="text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "contacto" : "contactos"}</p>
    </div>
  );
}
