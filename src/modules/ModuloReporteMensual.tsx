import { memo, useCallback, useState } from "react";
import type { AppData, ProcesoReclutamiento, ValeGas, ValeGasOrg } from "../domain/types";
import { MESES } from "../domain/options";
import { fmtCLP } from "../shared/dataHelpers";
import { calcPctRecl } from "../shared/reclutamientoHelpers";
import { getXlsx } from "../state/useAppData";
import { Select } from "../components/forms/fields";

type Props = {
  data: AppData;
  toastShow: (msg: string, opts?: any) => void;
};

function ModuloReporteMensual({ data, toastShow }: Props) {
  const currentMonth = MESES[new Date().getMonth()] || "Enero";
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const parseMonthOfDate = (dateStr: string): number => {
    if (!dateStr) return -1;
    const parts = dateStr.split("-");
    if (parts.length < 2) return -1;
    return parseInt(parts[1], 10) - 1;
  };

  const parseYearOfDate = (dateStr: string): number => {
    if (!dateStr) return -1;
    const parts = dateStr.split("-");
    if (parts.length < 2) return -1;
    const year = parseInt(parts[0], 10);
    return isNaN(year) ? -1 : year;
  };

  const monthIndex = MESES.indexOf(selectedMonth);

  const isInMonth = (...dates: string[]): boolean =>
    dates.some(d => parseMonthOfDate(d) === monthIndex && parseYearOfDate(d) === selectedYear);

  const monthCursos = data.cursos.filter(c => isInMonth(c.fechaSolicitud, c.fechaRequerida, c.ultimaActualizacion));
  const cursosEjecutados = monthCursos.filter(c => ["Ejecutado", "Cerrado"].includes(c.estado)).length;
  const cursosAbiertos = monthCursos.filter(c => c.estado !== "Cerrado").length;
  const cursosUrgentes = monthCursos.filter(c => c.origen === "Urgente no planificado").length;
  const cursosNoPlanificados = monthCursos.filter(c => c.origen === "No planificado necesario").length;
  const cursosP1 = monthCursos.filter(c => c.prioridad === "P1 Crítico").length;
  const cursosDetenidos = monthCursos.filter(c => c.estado === "Detenido").length;

  const monthOCs = data.ocs.filter(o => isInMonth(o.fechaSolicitud, o.fechaLimite, o.ultimaActualizacion));
  const ocsCreadas = monthOCs.filter(o => o.estadoOC !== "Pendiente crear").length;
  const ocsPendientes = monthOCs.filter(o => ["Pendiente crear", "Solicitada", "En aprobación"].includes(o.estadoOC)).length;
  const ocsCerradas = monthOCs.filter(o => o.estadoOC === "Cerrada").length;
  const ocsBloqueadas = monthOCs.filter(o => o.bloqueadoPor && o.bloqueadoPor !== "Sin bloqueo").length;

  const monthDiplomas = data.diplomas.filter(d => isInMonth(d.fechaSolicitudOTEC, d.fechaRecepcionDoc, d.fechaEnvioParticipante, d.fechaSubidaBUK, d.ultimaActualizacion));
  const dipPedididos = monthDiplomas.filter(d => d.etapa === "Pedir a la OTEC").length;
  const dipParticipante = monthDiplomas.filter(d => d.etapa === "Enviar o pedir al participante").length;
  const dipBUK = monthDiplomas.filter(d => d.etapa === "Subir a BUK").length;
  const dipCompletados = monthDiplomas.filter(d => d.etapa === "Completado").length;

  const monthEvaluaciones = data.evaluacionesPsicolaborales.filter(e => e.mes === selectedMonth && e.ano === selectedYear);
  const evSolicitadas = monthEvaluaciones.filter(e => e.estado === "Solicitada").length;
  const evRealizadas = monthEvaluaciones.filter(e => e.estado === "Realizada").length;
  const evInformes = monthEvaluaciones.filter(e => e.estado === "Informe recibido").length;
  const evCerradas = monthEvaluaciones.filter(e => e.estado === "Cerrada").length;
  const evBloqueadas = monthEvaluaciones.filter(e => e.bloqueadoPor && e.bloqueadoPor !== "Sin bloqueo").length;
  const evRecomendados = monthEvaluaciones.filter(e => e.resultado === "Recomendado").length;
  const evNoRecomendados = monthEvaluaciones.filter(e => e.resultado === "No recomendado").length;

  const monthProcesos = data.procesos.filter(p => isInMonth(p.fechaLimite, p.fechaProximaAccion, p.ultimaActualizacion));
  const procAbiertos = monthProcesos.filter(p => p.estadoActual !== "Cerrado").length;
  const procCerrados = monthProcesos.filter(p => p.estadoActual === "Cerrado").length;
  const procBloqueados = monthProcesos.filter(p => p.bloqueadoPor && p.bloqueadoPor !== "Sin bloqueo").length;
  const procCriticos = monthProcesos.filter(p => p.riesgo === "Alto" || p.prioridad === "P1 Crítico").length;

  const monthPracticantes = data.practicantes.filter(p => {
    if (!p.fechaInicio) return false;
    const monthStart = new Date(selectedYear, monthIndex, 1);
    const monthEnd = new Date(selectedYear, monthIndex + 1, 0);
    const inicio = new Date(p.fechaInicio);
    const termino = p.fechaTermino ? new Date(p.fechaTermino) : null;
    return inicio <= monthEnd && (!termino || termino >= monthStart);
  });
  const pracActivos = monthPracticantes.filter(p => p.estado === "Activo").length;
  const pracIngresos = monthPracticantes.filter(p => parseMonthOfDate(p.fechaInicio) === monthIndex && parseYearOfDate(p.fechaInicio) === selectedYear).length;
  const pracTerminos = monthPracticantes.filter(p => parseMonthOfDate(p.fechaTermino) === monthIndex && parseYearOfDate(p.fechaTermino) === selectedYear).length;
  const pracPorBuscar = monthPracticantes.filter(p => p.estado === "Por buscar").length;

  const budgetTotal = data.presupuesto.reduce((s, p) => s + p.presupuestoTotal, 0);
  const budgetGastado = data.presupuesto.reduce((s, p) => s + p.gastado, 0);
  const budgetDisponible = budgetTotal - budgetGastado;
  const budgetPct = budgetTotal > 0 ? Math.round((budgetGastado / budgetTotal) * 100) : 0;

  const monthReclutamiento = (data.reclutamiento || []).filter((r: ProcesoReclutamiento) => r.mesIngreso === selectedMonth);
  const reclTotal = monthReclutamiento.length;
  const reclAbiertos = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Abierto").length;
  const reclCerrados = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Cerrado").length;
  const reclPausados = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Pausado").length;
  const reclDesistidos = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Desistido").length;
  const reclBloqueados = monthReclutamiento.filter((r: ProcesoReclutamiento) => !["Cerrado", "Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;
  const reclAvanceProm = reclTotal === 0 ? 0 : Math.round(monthReclutamiento.reduce((s: number, r: ProcesoReclutamiento) => s + calcPctRecl(r), 0) / reclTotal);

  const vgAll = data.valesGas || [];
  const vgActivos = vgAll.filter((v: ValeGas) => v.estado !== "Cerrado" && v.estado !== "Detenido").length;
  const vgEnDescuento = vgAll.filter((v: ValeGas) => v.estado === "En descuento").length;
  const vgCerrados = vgAll.filter((v: ValeGas) => v.estado === "Cerrado").length;
  const vgAsignadosTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.totalValesAsignados || 0), 0);
  const vgUsadosTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.valesUsados || 0), 0);
  const vgSaldoTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.saldoVales || 0), 0);
  const vgTotalDescontado = vgAll.reduce((s: number, v: ValeGas) => s + (v.totalDescontado || 0), 0);
  const vgOrgAll: ValeGasOrg[] = data.valesGasOrganizacion || [];
  const vgOrgMes = vgOrgAll.filter((v: ValeGasOrg) => parseMonthOfDate(v.fechaRegistro) === monthIndex && (v as any).fechaRegistro && v.periodo?.includes(String(selectedYear)));
  const vgOrgIngresosMes = vgOrgMes.filter((v: ValeGasOrg) => v.tipoMovimiento === "Ingreso de vales").reduce((s: number, v: ValeGasOrg) => s + (v.cantidadVales || 0), 0);
  const vgOrgAjustesNegMes = vgOrgMes.filter((v: ValeGasOrg) => v.tipoMovimiento === "Ajuste negativo").reduce((s: number, v: ValeGasOrg) => s + (v.cantidadVales || 0), 0);
  const vgOrgStockMes = vgOrgMes.reduce((s: number, v: ValeGasOrg) => v.tipoMovimiento === "Ajuste negativo" ? s - (v.cantidadVales || 0) : s + (v.cantidadVales || 0), 0);

  const blockCounts: Record<string, number> = {
    "Falta aprobación": 0, "Falta OC": 0, "Falta OTEC": 0,
    "Falta participante": 0, "Falta informe": 0, "Falta presupuesto": 0, "Otros": 0,
  };
  const countBlocks = (item: any) => {
    const b = item.bloqueadoPor;
    if (b && b !== "Sin bloqueo") {
      if (blockCounts[b] !== undefined) blockCounts[b]++;
      else blockCounts["Otros"]++;
    }
  };
  monthCursos.forEach(countBlocks);
  monthOCs.forEach(countBlocks);
  monthPracticantes.forEach(countBlocks);
  monthDiplomas.forEach(countBlocks);
  monthEvaluaciones.forEach(countBlocks);
  monthProcesos.forEach(countBlocks);

  const topBlockeoName = Object.entries(blockCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Ninguno";
  const topBlockeoValue = blockCounts[topBlockeoName] || 0;
  const topBlockeoText = topBlockeoValue > 0 ? `${topBlockeoName} (${topBlockeoValue} veces)` : "Ninguno";

  const cursosPlanificados = monthCursos.filter(c => ["DNC", "Carta Gantt"].includes(c.origen)).length;
  const cursosUrgentesNuevos = monthCursos.filter(c => c.origen === "Urgente no planificado").length;
  const cursosNoPlanificadosNecesarios = monthCursos.filter(c => c.origen === "No planificado necesario" || c.origen === "Emergente por operación").length;
  const totalCursosReal = monthCursos.length;
  const diffPlanificadoReal = totalCursosReal - cursosPlanificados;

  const exportReportXLSX = async () => {
    const XLSX = await getXlsx();
    const wb = XLSX.utils.book_new();
    const reportData = [
      ["REPORTE MENSUAL EJECUTIVO", `${selectedMonth} ${selectedYear}`],
      ["Fecha de Generación", new Date().toLocaleDateString("es-CL")],
      [],
      ["1. RESUMEN DE CURSOS", ""],
      ["Cursos Ejecutados", cursosEjecutados], ["Cursos Abiertos", cursosAbiertos],
      ["Cursos Urgentes No Planificados", cursosUrgentes], ["Cursos No Planificados Necesarios", cursosNoPlanificados],
      ["Cursos P1 Críticos", cursosP1], ["Cursos Detenidos", cursosDetenidos],
      [],
      ["2. RESUMEN DE ORDENES DE COMPRA (OCs)", ""],
      ["OCs Creadas", ocsCreadas], ["OCs Pendientes", ocsPendientes], ["OCs Cerradas", ocsCerradas], ["OCs Bloqueadas", ocsBloqueadas],
      [],
      ["3. RESUMEN DE DIPLOMAS / CERTIFICADOS", ""],
      ["Documentos Pedidos a OTEC", dipPedididos], ["Pendientes de Participante", dipParticipante],
      ["Pendientes de Subir a BUK", dipBUK], ["Completados", dipCompletados],
      [],
      ["4. RESUMEN DE EVALUACIONES PSICOLABORALES", ""],
      ["Evaluaciones Solicitadas", evSolicitadas], ["Evaluaciones Realizadas", evRealizadas],
      ["Informes Recibidos", evInformes], ["Evaluaciones Cerradas", evCerradas],
      ["Evaluaciones Bloqueadas", evBloqueadas], ["Recomendados", evRecomendados], ["No Recomendados", evNoRecomendados],
      [],
      ["5. RESUMEN DE PRACTICANTES", ""],
      ["Practicantes Activos", pracActivos], ["Ingresos del Mes", pracIngresos],
      ["Términos del Mes", pracTerminos], ["Por Buscar", pracPorBuscar],
      [],
      ["6. RESUMEN DE PROCESOS PENDIENTES", ""],
      ["Procesos Abiertos", procAbiertos], ["Procesos Cerrados", procCerrados],
      ["Procesos Bloqueados", procBloqueados], ["Procesos Críticos / Riesgo Alto", procCriticos],
      [],
      ["7. RESUMEN DE PRESUPUESTO", ""],
      ["Presupuesto Asignado", budgetTotal], ["Presupuesto Ejecutado", budgetGastado],
      ["Saldo Disponible", budgetDisponible], ["Porcentaje Utilizado (%)", `${budgetPct}%`],
      [],
      ["8. FRECUENCIA DE BLOQUEOS", ""],
      ...Object.entries(blockCounts).map(([k, v]) => [k, v]),
      [],
      ["9. CARGA REAL VS PLANIFICACIÓN", ""],
      ["Cursos Planificados", cursosPlanificados], ["Cursos Urgentes Nuevos", cursosUrgentesNuevos],
      ["Cursos No Planificados Necesarios", cursosNoPlanificadosNecesarios],
      ["Carga Real Total (Cursos)", totalCursosReal], ["Diferencia (Real - Planificado)", diffPlanificadoReal],
      [],
      ["10. VALES DE GAS", ""],
      ["Stock registrado en el mes", vgOrgStockMes], ["Ingresos del mes", vgOrgIngresosMes],
      ["Ajustes negativos del mes", vgOrgAjustesNegMes], ["Registros Activos", vgActivos],
      ["En Descuento", vgEnDescuento], ["Cerrados", vgCerrados],
      ["Total Vales Asignados", vgAsignadosTotal], ["Total Vales Usados", vgUsadosTotal],
      ["Saldo Pendiente Colaboradores", vgSaldoTotal], ["Total Descontado", vgTotalDescontado],
      [],
      ["11. RECLUTAMIENTO", ""],
      ["Total procesos del mes", reclTotal], ["Abiertos", reclAbiertos], ["Cerrados", reclCerrados],
      ["Pausados", reclPausados], ["Desistidos", reclDesistidos], ["Bloqueados", reclBloqueados],
      ["Avance promedio (%)", `${reclAvanceProm}%`],
    ];
    const ws = XLSX.utils.aoa_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Mensual");
    XLSX.writeFile(wb, `reporte_mensual_kata_v5_${selectedMonth}_${selectedYear}.xlsx`);
    toastShow("Reporte mensual XLSX descargado", { type: "success" });
  };

  const printReport = useCallback(() => { window.print(); }, []);

  const exportReportJSON = () => {
    const jsonReport = {
      periodo: `${selectedMonth} ${selectedYear}`,
      cursos: { cursosEjecutados, cursosAbiertos, cursosUrgentes, cursosNoPlanificados, cursosP1, cursosDetenidos },
      ocs: { ocsCreadas, ocsPendientes, ocsCerradas, ocsBloqueadas },
      diplomas: { dipPedididos, dipParticipante, dipBUK, dipCompletados },
      evaluaciones: { evSolicitadas, evRealizadas, evInformes, evCerradas, evBloqueadas, evRecomendados, evNoRecomendados },
      practicantes: { pracActivos, pracIngresos, pracTerminos, pracPorBuscar },
      procesos: { procAbiertos, procCerrados, procBloqueados, procCriticos },
      presupuesto: { budgetTotal, budgetGastado, budgetDisponible, budgetPct },
      bloqueos: blockCounts,
      cargaVsPlanificacion: { cursosPlanificados, cursosUrgentesNuevos, cursosNoPlanificadosNecesarios, totalCursosReal, diffPlanificadoReal },
    };
    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `reporte_mensual_${selectedMonth}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("Reporte mensual JSON descargado", { type: "success" });
  };

  const copyExecutiveSummary = () => {
    const summaryText = `
REPORTE MENSUAL EJECUTIVO - ${selectedMonth} ${selectedYear}
=================================
Fecha de Generación: ${new Date().toLocaleDateString("es-CL")}

1. PRINCIPALES CIFRAS:
- Cursos Registrados: ${totalCursosReal} (Abiertos: ${cursosAbiertos}, Ejecutados: ${cursosEjecutados})
- Cursos Urgentes No Planificados: ${cursosUrgentes}
- OCs Creadas / Pendientes: ${ocsCreadas} / ${ocsPendientes}
- Evaluaciones Realizadas: ${evRealizadas} (Cerradas: ${evCerradas})
- Practicantes Activos: ${pracActivos}

2. SITUACIÓN DE BLOQUEOS:
- Bloqueo más frecuente: ${topBlockeoText}
- Procesos Bloqueados Totales: ${evBloqueadas + ocsBloqueadas + cursosDetenidos}

3. PRESUPUESTO DEL MES:
- Presupuesto Total: ${fmtCLP(budgetTotal)}
- Presupuesto Ejecutado: ${fmtCLP(budgetGastado)}
- % Utilizado: ${budgetPct}%
- Saldo Disponible: ${fmtCLP(budgetDisponible)}

4. CARGA REAL VS PLANIFICACIÓN:
- Cursos Planificados (DNC/Gantt): ${cursosPlanificados}
- Cursos Emergentes/Urgentes: ${cursosUrgentesNuevos + cursosNoPlanificadosNecesarios}
- Carga de Trabajo Adicional: ${diffPlanificadoReal} cursos más que la planificación original.

5. RECOMENDACIÓN OPERATIVA:
${diffPlanificadoReal > 0
  ? "Se observa una carga real significativamente superior a la planificación inicial por la aparición de cursos urgentes/no planificados. Se sugiere reevaluar los márgenes operativos para evitar sobrecarga y gestionar los bloqueos pendientes."
  : "La carga operativa del mes se mantiene alineada con la planificación formal. Se recomienda mantener el ritmo operativo de cierres."}
    `.trim();
    navigator.clipboard.writeText(summaryText);
    toastShow("Resumen ejecutivo copiado al portapapeles", { type: "success" });
  };

  return (
    <div className="print-target bg-white rounded-2xl border border-[#D9E2EC] p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Reporte Mensual Ejecutivo</h2>
          <p className="text-xs text-slate-500">Resumen y análisis de la actividad operativa mensual para reportes a jefatura.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <Select value={selectedMonth} onChange={setSelectedMonth} options={MESES} />
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border border-[#D9E2EC] rounded-xl px-4 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] transition-colors"
          >
            {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            title="Imprimir o guardar como PDF"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-slate-700 space-y-2">
        <h4 className="font-semibold text-blue-800 text-sm">Interpretación automática del mes:</h4>
        <p className="text-sm leading-relaxed">
          Durante <span className="font-semibold">{selectedMonth}</span> de <span className="font-semibold">{selectedYear}</span> se registraron <span className="font-semibold">{totalCursosReal}</span> cursos, de los cuales <span className="font-semibold">{cursosUrgentes}</span> fueron urgentes no planificados y <span className="font-semibold">{cursosNoPlanificados}</span> fueron no planificados pero necesarios.
          Además, se contabilizaron <span className="font-semibold">{evSolicitadas}</span> evaluaciones psicolaborales y se gestionaron <span className="font-semibold">{ocsCreadas}</span> órdenes de compra.
          Actualmente, el bloqueo más frecuente es <span className="font-semibold text-red-600">"{topBlockeoName}"</span>, ocurriendo <span className="font-semibold">{topBlockeoValue}</span> veces. Esto indica una carga operativa <span className="font-semibold">{totalCursosReal > 5 ? "alta y superior a la planificación original" : "estable y controlada"}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Cursos / Capacitaciones</span><span className="text-xs text-slate-400">Total: {totalCursosReal}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Cursos ejecutados:</span> <span className="font-semibold text-slate-800">{cursosEjecutados}</span></li>
            <li className="flex justify-between"><span>Cursos abiertos:</span> <span className="font-semibold text-slate-800">{cursosAbiertos}</span></li>
            <li className="flex justify-between"><span>Urgentes no planificados:</span> <span className="font-semibold text-slate-800">{cursosUrgentes}</span></li>
            <li className="flex justify-between"><span>No planificados necesarios:</span> <span className="font-semibold text-slate-800">{cursosNoPlanificados}</span></li>
            <li className="flex justify-between"><span>Cursos P1 críticos:</span> <span className="font-semibold text-red-600">{cursosP1}</span></li>
            <li className="flex justify-between"><span>Cursos detenidos:</span> <span className="font-semibold text-slate-800">{cursosDetenidos}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Órdenes de Compra (OCs)</span><span className="text-xs text-slate-400">Total: {monthOCs.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>OCs creadas:</span> <span className="font-semibold text-slate-800">{ocsCreadas}</span></li>
            <li className="flex justify-between"><span>OCs pendientes:</span> <span className="font-semibold text-slate-800">{ocsPendientes}</span></li>
            <li className="flex justify-between"><span>OCs cerradas:</span> <span className="font-semibold text-slate-800">{ocsCerradas}</span></li>
            <li className="flex justify-between"><span>OCs bloqueadas:</span> <span className="font-semibold text-red-600">{ocsBloqueadas}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Diplomas y Licencias</span><span className="text-xs text-slate-400">Total: {monthDiplomas.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Pedidos a OTEC:</span> <span className="font-semibold text-slate-800">{dipPedididos}</span></li>
            <li className="flex justify-between"><span>Pendientes de participante:</span> <span className="font-semibold text-slate-800">{dipParticipante}</span></li>
            <li className="flex justify-between"><span>Pendientes subir a BUK:</span> <span className="font-semibold text-red-600">{dipBUK}</span></li>
            <li className="flex justify-between"><span>Completados:</span> <span className="font-semibold text-slate-800">{dipCompletados}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Evaluaciones Psicolaborales</span><span className="text-xs text-slate-400">Total: {monthEvaluaciones.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Solicitadas:</span> <span className="font-semibold text-slate-800">{evSolicitadas}</span></li>
            <li className="flex justify-between"><span>Realizadas:</span> <span className="font-semibold text-slate-800">{evRealizadas}</span></li>
            <li className="flex justify-between"><span>Informes recibidos:</span> <span className="font-semibold text-slate-800">{evInformes}</span></li>
            <li className="flex justify-between"><span>Cerradas:</span> <span className="font-semibold text-slate-800">{evCerradas}</span></li>
            <li className="flex justify-between"><span>Bloqueadas:</span> <span className="font-semibold text-red-600">{evBloqueadas}</span></li>
            <li className="flex justify-between"><span>Recomendados / No recomendados:</span> <span className="font-semibold text-slate-800">{evRecomendados} / {evNoRecomendados}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Practicantes</span><span className="text-xs text-slate-400">Total: {monthPracticantes.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Activos:</span> <span className="font-semibold text-slate-800">{pracActivos}</span></li>
            <li className="flex justify-between"><span>Ingresos del mes:</span> <span className="font-semibold text-slate-800">{pracIngresos}</span></li>
            <li className="flex justify-between"><span>Términos del mes:</span> <span className="font-semibold text-slate-800">{pracTerminos}</span></li>
            <li className="flex justify-between"><span>Por buscar:</span> <span className="font-semibold text-slate-800">{pracPorBuscar}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Procesos Pendientes</span><span className="text-xs text-slate-400">Total: {monthProcesos.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Procesos abiertos:</span> <span className="font-semibold text-slate-800">{procAbiertos}</span></li>
            <li className="flex justify-between"><span>Procesos cerrados:</span> <span className="font-semibold text-slate-800">{procCerrados}</span></li>
            <li className="flex justify-between"><span>Bloqueados:</span> <span className="font-semibold text-red-600">{procBloqueados}</span></li>
            <li className="flex justify-between"><span>Críticos / Riesgo alto:</span> <span className="font-semibold text-red-600">{procCriticos}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Presupuesto Global</span><span className="text-xs text-slate-400">{budgetPct}% usado</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Asignado:</span> <span className="font-semibold text-slate-800">{fmtCLP(budgetTotal)}</span></li>
            <li className="flex justify-between"><span>Ejecutado:</span> <span className="font-semibold text-red-600">{fmtCLP(budgetGastado)}</span></li>
            <li className="flex justify-between"><span>Disponible:</span> <span className="font-semibold text-green-600">{fmtCLP(budgetDisponible)}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Vales de Gas</span><span className="text-xs text-slate-400">Total: {vgAll.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Stock registrado en el mes:</span> <span className="font-semibold text-slate-800">{vgOrgStockMes}</span></li>
            <li className="flex justify-between"><span>Ingresos del mes:</span> <span className="font-semibold text-slate-800">{vgOrgIngresosMes}</span></li>
            <li className="flex justify-between"><span>Ajustes negativos del mes:</span> <span className="font-semibold text-red-600">{vgOrgAjustesNegMes}</span></li>
            <li className="flex justify-between"><span>Registros activos:</span> <span className="font-semibold text-slate-800">{vgActivos}</span></li>
            <li className="flex justify-between"><span>En descuento:</span> <span className="font-semibold text-orange-600">{vgEnDescuento}</span></li>
            <li className="flex justify-between"><span>Cerrados:</span> <span className="font-semibold text-slate-800">{vgCerrados}</span></li>
            <li className="flex justify-between"><span>Vales asignados colabs.:</span> <span className="font-semibold text-slate-800">{vgAsignadosTotal}</span></li>
            <li className="flex justify-between"><span>Total descontado:</span> <span className="font-semibold text-slate-800">{vgTotalDescontado}</span></li>
            <li className="flex justify-between"><span>Saldo pendiente colabs.:</span> <span className="font-semibold text-emerald-600">{vgSaldoTotal}</span></li>
          </ul>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>Reclutamiento</span><span className="text-xs text-slate-400">Total mes: {reclTotal}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Abiertos:</span> <span className="font-semibold text-green-700">{reclAbiertos}</span></li>
            <li className="flex justify-between"><span>Cerrados:</span> <span className="font-semibold text-slate-800">{reclCerrados}</span></li>
            <li className="flex justify-between"><span>Pausados:</span> <span className="font-semibold text-yellow-700">{reclPausados}</span></li>
            <li className="flex justify-between"><span>Desistidos:</span> <span className="font-semibold text-red-600">{reclDesistidos}</span></li>
            <li className="flex justify-between"><span>Bloqueados:</span> <span className="font-semibold text-red-600">{reclBloqueados}</span></li>
            <li className="flex justify-between"><span>Avance promedio:</span> <span className="font-semibold text-blue-700">{reclAvanceProm}%</span></li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="border border-slate-100 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
            <span>Frecuencia de Bloqueos en el Período</span>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Alerta</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(blockCounts).map(([block, count]) => {
              const maxCount = Math.max(...Object.values(blockCounts), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={block} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{block}</span>
                    <span className="font-semibold text-slate-800">{count} veces</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
            <span>Carga Real vs Planificación Formal</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Carga real</span>
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border">
                <div className="text-[10px] text-slate-500 uppercase">Planificados</div>
                <div className="text-lg font-bold text-slate-700">{cursosPlanificados}</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                <div className="text-[10px] text-red-500 uppercase">Urgentes nuevos</div>
                <div className="text-lg font-bold text-red-700">{cursosUrgentesNuevos}</div>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <div className="text-[10px] text-amber-500 uppercase">No planificados</div>
                <div className="text-lg font-bold text-amber-700">{cursosNoPlanificadosNecesarios}</div>
              </div>
            </div>
            <div className="bg-slate-50/50 p-3 rounded-lg border text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Carga de Trabajo Total (Real):</span>
                <span className="font-bold text-slate-800">{totalCursosReal} cursos</span>
              </div>
              <div className="flex justify-between">
                <span>Diferencia con Planificación Formal:</span>
                <span className={`font-bold ${diffPlanificadoReal > 0 ? "text-red-600" : "text-slate-800"}`}>
                  {diffPlanificadoReal > 0 ? `+${diffPlanificadoReal}` : diffPlanificadoReal} cursos
                </span>
              </div>
            </div>
            {diffPlanificadoReal > 0 && (
              <div className="text-xs text-red-700 bg-red-50/50 border border-red-100 rounded-lg p-3">
                <span className="font-semibold">Carga de trabajo excedida:</span> La aparición de cursos no planificados y requerimientos urgentes ha incrementado la carga operativa en un <span className="font-bold">{(diffPlanificadoReal / (cursosPlanificados || 1) * 100).toFixed(0)}%</span> por sobre la planificación inicial.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end border-t border-slate-100 pt-4 print:hidden">
        <button onClick={copyExecutiveSummary} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
          Copiar Resumen Ejecutivo
        </button>
        <button onClick={exportReportJSON} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors">
          Descargar Reporte JSON
        </button>
        <button onClick={exportReportXLSX} className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          Descargar Reporte XLSX
        </button>
      </div>
    </div>
  );
}

export default memo(ModuloReporteMensual);
