import { memo, useState } from "react";
import { Fuel, Search } from "lucide-react";
import { Badge, SemaforoBadge, estadoColor } from "../shared/badges";
import type { ValeGas, ValeGasOrg } from "../domain/types";
import { ESTADOS_VALE_GAS, TIPOS_MOVIMIENTO_VALES } from "../domain/options";
import { toDDMMYYYY } from "../utils/appHelpers";
import { INPUT_BASE } from "../components/forms/fields";
import { DataTable as Table } from "../components/tables/DataTable";
import { FilterPanel, ModuleHeader } from "../components/ui";

function ModuloValesGas({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName, tableLoading }: any) {
  const [filterEstado, setFilterEstado] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("");
  const [filterOrgTipo, setFilterOrgTipo] = useState("");
  const [filterOrgPeriodo, setFilterOrgPeriodo] = useState("");

  const valesGas: ValeGas[] = data.valesGas || [];
  const valesGasOrg: ValeGasOrg[] = data.valesGasOrganizacion || [];

  // â”€â”€ Bloque 1: KPIs generales â”€â”€
  const stockOrg = valesGasOrg.reduce((s, v) => {
    if (v.tipoMovimiento === "Ajuste negativo") return s - (v.cantidadVales || 0);
    return s + (v.cantidadVales || 0);
  }, 0);
  const valesAsignadosColabs = valesGas.reduce((s, v) => s + (v.totalValesAsignados || 0), 0);
  const valesUtilizados = valesGas.reduce((s, v) => s + (v.valesUsados || 0), 0);
  const saldoDisponibleOrg = stockOrg - valesAsignadosColabs;
  const saldoPendienteColabs = valesGas.reduce((s, v) => s + (v.saldoVales || 0), 0);
  const totalDescontadoColabs = valesGas.reduce((s, v) => s + (v.totalDescontado || 0), 0);
  const registrosEnDescuento = valesGas.filter(v => v.estado === "En descuento").length;

  // â”€â”€ Bloque 2: Filtros org â”€â”€
  const orgPeriodos = Array.from(new Set(valesGasOrg.map(v => v.periodo).filter(Boolean)));
  const filteredOrg = valesGasOrg.filter(v => {
    const matchTipo = !filterOrgTipo || v.tipoMovimiento === filterOrgTipo;
    const matchPeriodo = !filterOrgPeriodo || v.periodo === filterOrgPeriodo;
    return matchTipo && matchPeriodo;
  });

  // â”€â”€ Bloque 3: Filtros colaboradores â”€â”€
  const areas = Array.from(new Set(valesGas.map((v: ValeGas) => v.area).filter(Boolean)));
  const periodos = Array.from(new Set(valesGas.map((v: ValeGas) => v.periodo).filter(Boolean)));
  const filtered = valesGas.filter((v: ValeGas) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.colaborador.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.periodo.toLowerCase().includes(q);
    const matchEstado = !filterEstado || v.estado === filterEstado;
    const matchArea = !filterArea || v.area === filterArea;
    const matchPeriodo = !filterPeriodo || v.periodo === filterPeriodo;
    return matchSearch && matchEstado && matchArea && matchPeriodo;
  });

  const columnsColabs = [
    { key: "colaborador", label: "Colaborador" },
    { key: "area", label: "Ãrea" },
    { key: "periodo", label: "PerÃ­odo" },
    { key: "fechaEntrega", label: "Fecha entrega", render: (v: ValeGas) => toDDMMYYYY(v.fechaEntrega) },
    { key: "totalValesAsignados", label: "Vales asignados" },
    { key: "valesUsados", label: "Vales utilizados" },
    { key: "saldoVales", label: "Saldo colaborador" },
    { key: "descuentoDiario", label: "Desc/dÃ­a" },
    { key: "diasDescuento", label: "DÃ­as desc." },
    { key: "totalDescontado", label: "Total desc." },
    { key: "estado", label: "Estado", render: (v: ValeGas) => <Badge label={v.estado} colorClass={estadoColor[v.estado] || ""} /> },
    { key: "responsable", label: "Responsable", render: (v: ValeGas) => getResponsableName(data, v.responsableId) },
    { key: "fechaProximaRevision", label: "PrÃ³x. revisiÃ³n", render: (v: ValeGas) => v.fechaProximaRevision ? <SemaforoBadge fecha={v.fechaProximaRevision} /> : <span className="text-slate-400 text-xs">Sin fecha</span> },
    { key: "observaciones", label: "Observaciones" },
  ];

  const columnsOrg = [
    { key: "fechaRegistro", label: "Fecha registro", render: (v: ValeGasOrg) => toDDMMYYYY(v.fechaRegistro) },
    { key: "periodo", label: "PerÃ­odo" },
    { key: "tipoMovimiento", label: "Tipo movimiento" },
    { key: "cantidadVales", label: "Cantidad" },
    { key: "motivo", label: "Motivo" },
    { key: "responsable", label: "Responsable", render: (v: ValeGasOrg) => getResponsableName(data, v.responsableId) },
    { key: "observaciones", label: "Observaciones" },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={<Fuel size={20} className="text-white" />}
        gradient="from-emerald-400 to-teal-500"
        title="Vales de Gas"
        subtitle="Control integral de stock organizacional y distribuciÃ³n a colaboradores."
      />

      {/* â”€â”€ BLOQUE 1: RESUMEN GENERAL â”€â”€ */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Resumen general (calculado)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stockOrg}</div>
            <div className="text-xs text-slate-500 mt-0.5">Stock organizaciÃ³n</div>
          </div>
          <div className={`border rounded-xl p-3 text-center ${saldoDisponibleOrg < 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
            <div className={`text-2xl font-bold ${saldoDisponibleOrg < 0 ? "text-red-600" : "text-emerald-600"}`}>{saldoDisponibleOrg}</div>
            <div className="text-xs text-slate-500 mt-0.5">Saldo disponible org.</div>
            {saldoDisponibleOrg < 0 && <div className="text-xs text-red-600 mt-1 font-semibold">âš  MÃ¡s asignados que stock registrado</div>}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{valesAsignadosColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Vales asignados</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{valesUtilizados}</div>
            <div className="text-xs text-slate-500 mt-0.5">Vales utilizados</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{saldoPendienteColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Saldo pendiente colabs.</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-slate-700">{totalDescontadoColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total descontado</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{registrosEnDescuento}</div>
            <div className="text-xs text-slate-500 mt-0.5">En descuento</div>
          </div>
        </div>
      </div>

      {/* â”€â”€ BLOQUE 2: MOVIMIENTOS ORGANIZACIÃ“N â”€â”€ */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Movimientos de vales â€” OrganizaciÃ³n</h2>
          <button onClick={() => openNew("valesGasOrganizacion")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">+ Registrar vales organizaciÃ³n</button>
        </div>
        <div className="flex items-center gap-2">
          <FilterPanel activeCount={(filterOrgTipo ? 1 : 0) + (filterOrgPeriodo ? 1 : 0)} onClear={() => { setFilterOrgTipo(""); setFilterOrgPeriodo(""); }}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tipo movimiento</label>
              <select value={filterOrgTipo} onChange={e => setFilterOrgTipo(e.target.value)} className={INPUT_BASE}>
                <option value="">Todos los tipos</option>
                {TIPOS_MOVIMIENTO_VALES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">PerÃ­odo</label>
              <select value={filterOrgPeriodo} onChange={e => setFilterOrgPeriodo(e.target.value)} className={INPUT_BASE}>
                <option value="">Todos los perÃ­odos</option>
                {orgPeriodos.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
              </select>
            </div>
          </FilterPanel>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table
            columns={columnsOrg}
            rows={filteredOrg}
            loading={tableLoading}
            onEdit={(r: ValeGasOrg) => openEdit("valesGasOrganizacion", r)}
            onDelete={deleteItem ? (id: string) => deleteItem("valesGasOrganizacion", id) : undefined}
          />
        </div>
      </div>

      {/* â”€â”€ BLOQUE 3: ENTREGAS A COLABORADORES â”€â”€ */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Registros por colaborador</h2>
          <button onClick={() => openNew("valesGas")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo registro colaborador</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-56 focus-within:border-blue-300 transition-colors">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador, Ã¡rea..." aria-label="Buscar vales de colaborador" className="bg-transparent flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 min-w-0" />
          </div>
          <FilterPanel activeCount={(filterEstado ? 1 : 0) + (filterArea ? 1 : 0) + (filterPeriodo ? 1 : 0)} onClear={() => { setFilterEstado(""); setFilterArea(""); setFilterPeriodo(""); }}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Estado</label>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} aria-label="Filtrar por estado" className={INPUT_BASE}>
                <option value="">Todos los estados</option>
                {ESTADOS_VALE_GAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Ãrea</label>
              <select value={filterArea} onChange={e => setFilterArea(e.target.value)} aria-label="Filtrar por Ã¡rea" className={INPUT_BASE}>
                <option value="">Todas las Ã¡reas</option>
                {areas.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">PerÃ­odo</label>
              <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} aria-label="Filtrar por perÃ­odo" className={INPUT_BASE}>
                <option value="">Todos los perÃ­odos</option>
                {periodos.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
              </select>
            </div>
          </FilterPanel>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table
            columns={columnsColabs}
            rows={filtered}
            loading={tableLoading}
            onEdit={(r: ValeGas) => openEdit("valesGas", r)}
            onDelete={deleteItem ? (id: string) => deleteItem("valesGas", id) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
export default memo(ModuloValesGas);
