import { memo, useMemo } from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import { fmtCLP } from "../shared/dataHelpers";
import { durMesesEntre } from "../utils/appHelpers";
import { ModuleHeader } from "../components/ui";
function ModuloPresupuesto({ data, search, setSearch, openNew: _openNew, openEdit, deleteItem: _deleteItem }: any) {

  // Calculate dynamic breakdowns
  const budgetBreakdown = useMemo(() => {
    // 1. OCs — calculado desde registros
    const ocBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase() === "ocs" || p.concepto.toLowerCase().startsWith("oc")) || { id: "", presupuestoTotal: 0, montoComprometidoManual: 0, montoEjecutadoManual: 0, observaciones: "" };
    const ocComprometido = data.ocs.filter((o: any) => ["Pendiente crear", "Solicitada", "En aprobación"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);
    const ocEjecutado = data.ocs.filter((o: any) => ["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);

    // 2. Practicantes — calculado desde registros
    const pracBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("practicante")) || { id: "", presupuestoTotal: 0, observaciones: "" };
    const pracComprometido = data.practicantes.filter((p: any) => p.estado !== "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * durMesesEntre(p.fechaInicio, p.fechaTermino)), 0);
    const pracEjecutado = data.practicantes.filter((p: any) => p.estado === "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * durMesesEntre(p.fechaInicio, p.fechaTermino)), 0);

    // 3. Evaluaciones Psicolaborales — calculado desde registros
    const evalBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("evaluaci")) || { id: "", presupuestoTotal: 0, observaciones: "" };
    const evalComprometido = data.evaluacionesPsicolaborales.filter((e: any) => !["Cerrada", "Detenida"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);
    const evalEjecutado = data.evaluacionesPsicolaborales.filter((e: any) => ["Cerrada"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);

    const rows = [
      {
        id: ocBudgetRow.id,
        key: "oc",
        area: "Órdenes de Compra (OC)",
        presupuesto: ocBudgetRow.presupuestoTotal,
        comprometido: ocComprometido,
        ejecutado: ocEjecutado,
        saldo: ocBudgetRow.presupuestoTotal - ocEjecutado - ocComprometido,
        observaciones: ocBudgetRow.observaciones || "Calculado desde módulo OCs"
      },
      {
        id: pracBudgetRow.id,
        key: "practicante",
        area: "Practicantes",
        presupuesto: pracBudgetRow.presupuestoTotal,
        comprometido: pracComprometido,
        ejecutado: pracEjecutado,
        saldo: pracBudgetRow.presupuestoTotal - pracEjecutado - pracComprometido,
        observaciones: pracBudgetRow.observaciones || "Calculado desde módulo Practicantes"
      },
      {
        id: evalBudgetRow.id,
        key: "evaluacion",
        area: "Evaluaciones Psicolaborales",
        presupuesto: evalBudgetRow.presupuestoTotal,
        comprometido: evalComprometido,
        ejecutado: evalEjecutado,
        saldo: evalBudgetRow.presupuestoTotal - evalEjecutado - evalComprometido,
        observaciones: evalBudgetRow.observaciones || "Calculado desde módulo Evaluaciones"
      }
    ];

    return rows;
  }, [data]);

  // Compute overall global totals across all defined budget categories
  const totalPresupuesto = budgetBreakdown.reduce((s, r) => s + r.presupuesto, 0);
  const totalComprometido = budgetBreakdown.reduce((s, r) => s + r.comprometido, 0);
  const totalEjecutado = budgetBreakdown.reduce((s, r) => s + r.ejecutado, 0);
  const saldoDisponible = totalPresupuesto - totalEjecutado - totalComprometido;
  const pctTotal = totalPresupuesto > 0 ? Math.round(((totalEjecutado + totalComprometido) / totalPresupuesto) * 100) : 0;

  // Filter breakdown rows for view search if search is active
  const filteredBreakdown = budgetBreakdown.filter(row => {
    if (!search) return true;
    return row.area.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={<Wallet size={20} className="text-white" />}
        gradient="from-emerald-400 to-teal-500"
        title="Control Financiero y Presupuesto"
        subtitle="Visión unificada del presupuesto, montos comprometidos, ejecutados y saldos en tiempo real."
        actions={<p className="text-xs text-slate-400 italic">Los módulos son fijos. Solo se edita el presupuesto asignado.</p>}
      />

      {/* 1. Resumen General Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">1. Resumen de Estado Financiero General</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center border">
            <div className="text-sm text-slate-500">Presupuesto Global Asignado</div>
            <div className="text-2xl font-bold text-slate-800">{fmtCLP(totalPresupuesto)}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <div className="text-sm text-orange-700">Monto Comprometido</div>
            <div className="text-2xl font-bold text-orange-600">{fmtCLP(totalComprometido)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <div className="text-sm text-red-700">Monto Ejecutado (Gastado)</div>
            <div className="text-2xl font-bold text-red-600">{fmtCLP(totalEjecutado)}</div>
          </div>
          <div className={`rounded-lg p-4 text-center border ${saldoDisponible < 0 ? "bg-red-50 border-red-300" : "bg-green-50 border-green-200"}`}>
            <div className={`text-sm ${saldoDisponible < 0 ? "text-red-700" : "text-green-700"}`}>Saldo Disponible (Asignado − Ejecutado − Comprometido)</div>
            <div className={`text-2xl font-bold ${saldoDisponible < 0 ? "text-red-600" : "text-green-600"}`}>{fmtCLP(saldoDisponible)}</div>
            {saldoDisponible < 0 && <div className="text-xs text-red-600 font-semibold mt-1 inline-flex items-center justify-center gap-1"><AlertTriangle size={13} />Presupuesto excedido</div>}
          </div>
        </div>

        {/* Barra de progreso: ejecutado + comprometido vs presupuesto */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Uso del presupuesto (Ejecutado + Comprometido vs Asignado):</span>
            <span className="font-semibold">{pctTotal}% comprometido/utilizado</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
            {totalPresupuesto > 0 && (
              <>
                <div
                  className="h-4 bg-red-500 transition-all"
                  style={{ width: `${Math.min((totalEjecutado / totalPresupuesto) * 100, 100)}%` }}
                  title="Ejecutado"
                />
                <div
                  className="h-4 bg-orange-400 transition-all"
                  style={{ width: `${Math.min((totalComprometido / totalPresupuesto) * 100, Math.max(0, 100 - (totalEjecutado / totalPresupuesto) * 100))}%` }}
                  title="Comprometido"
                />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Ejecutado</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>Comprometido</span>
          </div>
        </div>
      </div>

      {/* 2. Tabla por área / módulo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">2. Presupuesto por Área / Módulo</h3>
          <div className="w-64">
            <input
              type="text"
              placeholder="Filtrar por área..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3 text-right">Presupuesto Asignado</th>
                <th className="px-4 py-3 text-right">Monto Comprometido</th>
                <th className="px-4 py-3 text-right">Monto Ejecutado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right">% Uso</th>
                <th className="px-4 py-3">Observaciones</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdown.map((row, idx) => {
                const usePct = row.presupuesto > 0 ? Math.round(((row.ejecutado + row.comprometido) / row.presupuesto) * 100) : 0;
                return (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.area}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCLP(row.presupuesto)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{fmtCLP(row.comprometido)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{fmtCLP(row.ejecutado)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.saldo < 0 ? "text-red-600" : "text-green-600"}`}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {fmtCLP(row.saldo)}
                        {row.saldo < 0 && <AlertTriangle size={13} />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${usePct > 90 ? "text-red-600" : usePct > 75 ? "text-orange-500" : "text-green-600"}`}>
                        {usePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={row.observaciones}>
                      {row.observaciones}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const originalItem = data.presupuesto.find((p: any) => p.id === row.id);
                          openEdit("presupuesto", originalItem || { concepto: row.area, presupuestoTotal: row.presupuesto, observaciones: row.observaciones });
                        }}
                        className="text-blue-600 hover:underline text-xs font-semibold"
                      >
                        Editar presupuesto
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detalle de submontos asociados */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">3. Detalle de Submontos y Registros Asociados</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OCs list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle de Órdenes de Compra (OCs)</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.ocs.length === 0 ? (
                <p className="text-xs text-slate-400">No hay OCs registradas.</p>
              ) : (
                data.ocs.map((o: any) => (
                  <div key={o.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-700 truncate max-w-[200px]">{o.numeroOC || "S/N"} - {o.cursoAsociado}</div>
                      <div className="text-slate-400">Estado: {o.estadoOC}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtCLP(o.monto)}</div>
                      <span className={`px-1 rounded text-[10px] ${["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC) ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC) ? "Ejecutado" : "Comprometido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Practicantes list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle de Practicantes</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.practicantes.length === 0 ? (
                <p className="text-xs text-slate-400">No hay practicantes registrados.</p>
              ) : (
                data.practicantes.map((p: any) => {
                  const m = durMesesEntre(p.fechaInicio, p.fechaTermino);
                  const total = (p.costoMensual || 0) * m;
                  return (
                    <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-700">{p.nombre}</div>
                        <div className="text-slate-400">Duración: {m} meses ({p.estado})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{fmtCLP(total)}</div>
                        <span className={`px-1 rounded text-[10px] ${p.estado === "Finalizado" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {p.estado === "Finalizado" ? "Ejecutado" : "Comprometido"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Evaluaciones list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle Evaluaciones Psicolaborales</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.evaluacionesPsicolaborales.length === 0 ? (
                <p className="text-xs text-slate-400">No hay evaluaciones registradas.</p>
              ) : (
                data.evaluacionesPsicolaborales.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-700 truncate max-w-[200px]">{e.candidato} - {e.cargo}</div>
                      <div className="text-slate-400">Estado: {e.estado}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtCLP(e.costo)}</div>
                      <span className={`px-1 rounded text-[10px] ${e.estado === "Cerrada" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {e.estado === "Cerrada" ? "Ejecutado" : "Comprometido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default memo(ModuloPresupuesto);
