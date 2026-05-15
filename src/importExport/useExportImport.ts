import { useState } from "react";
import type React from "react";
import type { AppData } from "../domain/types";
import { ahora, hoy, normalizeDateFromXlsx, normalizeReclutamientoCampo, parseXlsxMoney, parseXlsxNumber } from "../utils/appHelpers";
import { can } from "../auth/permissions";
import type { UserRole } from "../auth/authTypes";
import { logAudit } from "../audit/auditService";
import { createJsonBlob } from "./jsonExport";
import { buildExportSheets } from "./xlsxExport";
import { xlsxSheetToObjects, type XlsxParseResult } from "./xlsxImport";
import { getXlsx, crearDatosEjemplo, limpiarDatos } from "../state/useAppData";
import { migrateData } from "../storage/migrations";
import { resolveResponsable, getResponsableName } from "../shared/dataHelpers";
import type { ConfirmState, ToastType } from "../shared/formTypes";

type ToastShow = (title: string, opts?: { type?: ToastType; message?: string; action?: { label: string; onClick: () => void }; duration?: number }) => void;

type UseExportImportParams = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  setConfirm: (c: ConfirmState | null) => void;
  runBackupAndToast: (motivo: string) => void;
  toastShow: ToastShow;
  currentRole: UserRole | undefined;
};

export function useExportImport({ data, setData, setConfirm, runBackupAndToast, toastShow, currentRole }: UseExportImportParams) {
  const [exporting, setExporting] = useState<null | "json" | "jsonAnon" | "jsonSummary" | "xlsx" | "xlsxAnon" | "template" | "cleanTemplate">(null);
  const [lastJSONExport, setLastJSONExport] = useState<string>(() => localStorage.getItem("kata_last_json_export") || "");
  const [lastXLSXExport, setLastXLSXExport] = useState<string>(() => localStorage.getItem("kata_last_xlsx_export") || "");

  const canExportFull = can(currentRole, "data:export:full");
  const canExportSummary = can(currentRole, "data:export:summary");
  const canExportAnonymized = can(currentRole, "data:export:anonymized");

  const confirmSensitiveExport = (label: string, cb: () => void) => {
    setConfirm({
      title: "Confirmar exportación sensible",
      message: `La exportación ${label} incluye datos sensibles (RUT, correo, teléfono y nombres). Confirma que tienes autorización y que guardarás el archivo de forma segura.`,
      variant: "warning",
      confirmLabel: "Sí, exportar",
      onConfirm: () => { cb(); setConfirm(null); },
    });
  };

  const anonymizeData = (input: AppData): AppData => {
    const redact = (value: string) => (value ? "REDACTADO" : "");
    return {
      ...input,
      cursos: input.cursos.map(c => ({ ...c, solicitante: redact(c.solicitante) })),
      practicantes: input.practicantes.map(p => ({ ...p, nombre: redact(p.nombre) })),
      diplomas: input.diplomas.map(d => ({ ...d, participante: redact(d.participante) })),
      contactos: input.contactos.map(c => ({ ...c, nombre: redact(c.nombre), correo: redact(c.correo), telefono: redact(c.telefono) })),
      evaluacionesPsicolaborales: input.evaluacionesPsicolaborales.map(e => ({ ...e, candidato: redact(e.candidato), rut: redact(e.rut) })),
      valesGas: input.valesGas.map(v => ({ ...v, colaborador: redact(v.colaborador) })),
      reclutamiento: input.reclutamiento.map(r => ({ ...r, reclutador: redact(r.reclutador) })),
    };
  };

  const buildSummary = (input: AppData) => ({
    generadoEn: ahora(),
    versionEsquema: input.meta.version,
    conteos: {
      cursos: input.cursos.length, ocs: input.ocs.length, practicantes: input.practicantes.length,
      presupuesto: input.presupuesto.length, procesos: input.procesos.length, diplomas: input.diplomas.length,
      cargaSemanal: input.cargaSemanal.length, contactos: input.contactos.length,
      evaluacionesPsicolaborales: input.evaluacionesPsicolaborales.length,
      valesGas: input.valesGas.length, valesGasOrganizacion: input.valesGasOrganizacion.length,
      reclutamiento: input.reclutamiento.length,
    },
  });

  // ── JSON ────────────────────────────────────

  const exportJSONFull = () => {
    setExporting("json");
    try {
      logAudit("data:export", { detail: "Exportación JSON completa" });
      const blob = createJsonBlob(data);
      const a = document.createElement("a"); const url = URL.createObjectURL(blob);
      a.href = url; a.download = `total-control-rh-backup-${hoy()}.json`; a.click(); URL.revokeObjectURL(url);
      const timeNow = ahora();
      localStorage.setItem("kata_last_json_export", timeNow);
      setLastJSONExport(timeNow);
      setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: timeNow } }));
      toastShow("JSON exportado correctamente", { type: "success" });
    } finally { setExporting(null); }
  };

  const exportJSON = () => {
    if (!canExportFull) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos completos." }); return; }
    confirmSensitiveExport("JSON completo", exportJSONFull);
  };

  const exportJSONAnonymized = () => {
    if (!canExportAnonymized) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos anonimizados." }); return; }
    setExporting("jsonAnon");
    try {
      logAudit("data:export", { detail: "Exportación JSON anonimizada" });
      const blob = createJsonBlob(anonymizeData(data));
      const a = document.createElement("a"); const url = URL.createObjectURL(blob);
      a.href = url; a.download = `total-control-rh-backup-anon-${hoy()}.json`; a.click(); URL.revokeObjectURL(url);
      toastShow("JSON anonimizado exportado correctamente", { type: "success" });
    } finally { setExporting(null); }
  };

  const exportJSONSummary = () => {
    if (!canExportSummary) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar resúmenes." }); return; }
    setExporting("jsonSummary");
    try {
      logAudit("data:export", { detail: "Exportación JSON resumen" });
      const blob = new Blob([JSON.stringify(buildSummary(data), null, 2)], { type: "application/json" });
      const a = document.createElement("a"); const url = URL.createObjectURL(blob);
      a.href = url; a.download = `total-control-rh-resumen-${hoy()}.json`; a.click(); URL.revokeObjectURL(url);
      toastShow("Resumen exportado correctamente", { type: "success" });
    } finally { setExporting(null); }
  };

  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed || typeof parsed !== "object") { toastShow("Respaldo corrupto o inválido", { type: "error" }); return; }
          const imported = migrateData(parsed, crearDatosEjemplo());
          setConfirm({
            title: "Confirmar importación JSON",
            message: "Se reemplazarán los datos actuales. Se creará un respaldo automático antes de importar.",
            variant: "warning", confirmLabel: "Importar",
            onConfirm: () => { runBackupAndToast("importar"); setData(imported); toastShow("Datos importados exitosamente", { type: "success" }); setConfirm(null); },
          });
        } catch { toastShow("Error al leer el archivo JSON", { type: "error", message: "Verifica que el archivo sea válido." }); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // ── XLSX ────────────────────────────────────

  const exportXLSXFull = async () => {
    setExporting("xlsx");
    try {
      logAudit("data:export", { detail: "Exportación XLSX completa" });
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const sheets = buildExportSheets(data, getResponsableName);
      sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, `control_operativo_kata_v5_${hoy()}.xlsx`);
      const timeNow = ahora();
      localStorage.setItem("kata_last_xlsx_export", timeNow);
      setLastXLSXExport(timeNow);
      setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: timeNow } }));
      toastShow("XLSX exportado correctamente", { type: "success" });
    } finally { setExporting(null); }
  };

  const exportXLSX = () => {
    if (!canExportFull) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos completos." }); return; }
    confirmSensitiveExport("XLSX completo", exportXLSXFull);
  };

  const exportXLSXAnonymized = async () => {
    if (!canExportAnonymized) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos anonimizados." }); return; }
    setExporting("xlsxAnon");
    try {
      logAudit("data:export", { detail: "Exportación XLSX anonimizada" });
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const sheets = buildExportSheets(anonymizeData(data), getResponsableName);
      sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, `control_operativo_kata_v5_anon_${hoy()}.xlsx`);
      toastShow("XLSX anonimizado exportado correctamente", { type: "success" });
    } finally { setExporting(null); }
  };

  const exportLimpia = async () => {
    setExporting("cleanTemplate");
    try {
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const headers: Record<string, string[]> = {
        Cursos: ["id","curso","origen","area","solicitante","fechaSolicitud","fechaRequerida","estado","prioridad","nivelCritico","requiereOC","numeroOC","proveedor","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        OCs: ["id","numeroOC","categoriaOC","cursoAsociado","proveedor","monto","fechaSolicitud","fechaLimite","estadoOC","prioridad","accionPendiente","responsable","bloqueadoPor","ultimaActualizacion","observaciones"],
        Practicantes: ["id","nombre","area","especialidad","fechaInicio","fechaTermino","costoMensual","estado","responsable","proximoPaso","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        Presupuesto: ["id","concepto","presupuestoTotal","gastado","responsable","ultimaActualizacion","observaciones"],
        Procesos: ["id","proceso","tipo","estadoActual","queFalta","responsable","fechaLimite","riesgo","prioridad","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        Diplomas: ["id","cursoAsociado","participante","tipoDocumento","otec","etapa","fechaSolicitudOTEC","fechaRecepcionDoc","fechaEnvioParticipante","fechaSubidaBUK","estadoBUK","prioridad","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        "Evaluaciones Psicolaborales": ["id","mes","ano","cargo","area","candidato","rut","tipoEvaluacion","proveedor","fechaSolicitud","fechaEvaluacion","fechaEntregaInforme","estado","resultado","prioridad","responsable","costo","requiereOC","numeroOC","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        "Carga Semanal": ["id","semana","cursosPlanificados","cursosUrgentesNuevos","cursosNoPlanificados","ocsNuevas","diplomasPendientes","procesosBloqueados","comentario"],
        Contactos: ["id","nombre","rol","areaEmpresa","correo","telefono","relacion","activo","observaciones"],
        "Vales de Gas": ["id","colaborador","contactoId","area","periodo","fechaEntrega","totalValesAsignados","valesUsados","saldoVales","descuentoDiario","diasDescuento","totalDescontado","estado","responsable","fechaProximaRevision","observaciones","ultimaActualizacion"],
        "Vales Gas Organización": ["id","fechaRegistro","periodo","tipoMovimiento","cantidadVales","motivo","responsable","observaciones","ultimaActualizacion"],
        "Reclutamiento": ["id","reclutamiento","plantaCentro","tipoVacante","mesIngreso","revisadoPPTO","procesoBuk","publicado","seleccionCV","cvSeleccionadoBuk","entrevistaJefatura","entrevistaGP","testPsicolaboral","testHogan","seleccionado","cartaOferta","envioCartaOferta","firmaCartaOferta","fechaIngreso","reclutador","proceso","prioridad","bloqueadoPor","proximaAccion","fechaProximaAccion","observaciones","ultimaActualizacion"],
      };
      Object.entries(headers).forEach(([name, cols]) => { const ws = XLSX.utils.aoa_to_sheet([cols]); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, "plantilla_limpia_kata_v5.xlsx");
      toastShow("Plantilla limpia descargada", { type: "success" });
    } finally { setExporting(null); }
  };

  const downloadXlsxTemplate = async () => {
    setExporting("template");
    try {
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const readmeData = [
        ["PulsoLaboral — Plantilla oficial de carga XLSX"], [""],
        ["INSTRUCCIONES:"],
        ["1. No cambiar nombres de hojas."], ["2. No cambiar encabezados de columnas."],
        ["3. Completar una fila por registro."], ["4. Las fechas deben ir en formato dd/mm/yyyy."],
        ["5. Los montos deben ir como números (sin puntos de miles ni símbolos $)."],
        ["6. Las columnas ID pueden dejarse vacías; la app generará IDs automáticamente."],
        ["7. Si se deja responsable vacío, se usará 'Sin responsable'."],
        ["8. Antes de importar, se recomienda exportar un respaldo JSON."],
        ["9. Cada hoja corresponde a un módulo de la app."],
        ["10. Modo fusión: registros con ID existente se actualizan; sin ID se crean como nuevos."],
        ["11. Modo reemplazo: módulos presentes en el XLSX reemplazan la información actual."],
        ["12. Las hojas no incluidas en el XLSX no serán modificadas."],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readmeData), "README");
      const sheets: Record<string, string[]> = {
        "Contactos": ["ID","Nombre","Rol","Área / Empresa","Correo","Teléfono","Relación","Activo","Observaciones"],
        "Cursos": ["ID","Curso / Capacitación","Origen","Área","Solicitante","Fecha solicitud","Fecha requerida","Estado","Prioridad","Nivel crítico","Requiere OC","N° OC asociada","Proveedor / OTEC","Responsable","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
        "OCs": ["ID","N° OC","Categoría OC","Curso / Servicio asociado","Proveedor","Monto","Fecha solicitud","Fecha límite","Estado OC","Prioridad","Acción pendiente","Responsable","Bloqueado por","Observaciones"],
        "Practicantes": ["ID","Nombre","Área","Especialidad","Fecha inicio","Fecha término","Costo mensual","Estado","Responsable","Próximo paso","Fecha próxima acción","Bloqueado por","Observaciones"],
        "Presupuesto": ["ID","Área / Módulo","Presupuesto asignado","Monto comprometido manual","Monto ejecutado manual","Modo cálculo","Observaciones"],
        "Procesos Pendientes": ["ID","Proceso","Tipo","Estado actual","Qué falta","Responsable","Fecha límite","Riesgo si no se hace","Prioridad","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
        "Diplomas BUK": ["ID","Curso asociado","Participante","Tipo documento","OTEC / proveedor","Etapa","Fecha solicitud a OTEC","Fecha recepción documento","Fecha envío al participante","Fecha subida a BUK","Estado BUK","Prioridad","Responsable","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
        "Evaluaciones Psicolaborales": ["ID","Mes","Año","Cargo","Área","Candidato","RUT candidato","Tipo evaluación","Proveedor / Psicólogo","Fecha solicitud","Fecha evaluación","Fecha entrega informe","Estado","Resultado","Prioridad","Responsable","Costo","Requiere OC","N° OC asociada","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
        "Carga Semanal": ["ID","Semana","Año","Cursos planificados","Cursos urgentes nuevos","Cursos no planificados necesarios","OCs nuevas","Diplomas pendientes","Procesos bloqueados","Comentario"],
        "Vales de Gas Colaboradores": ["ID","Colaborador","Contacto asociado","Área","Periodo","Fecha entrega","Vales asignados al colaborador","Vales entregados / utilizados","Descuento diario","Días descuento","Estado","Responsable","Fecha próxima revisión","Observaciones"],
        "Vales Gas Organización": ["ID","Fecha registro","Periodo","Tipo movimiento","Cantidad vales","Motivo","Responsable","Observaciones","Última actualización"],
        "Reclutamiento": ["ID","Reclutamiento","Planta o Centro","Tipo de vacante","Mes ingreso","Revisado PPTO","Proceso en BUK","Publicado","Selección de CV","CV Seleccionado en BUK","Entrevista Jefatura","Entrevista GP","Test Psicolaboral","Test Hogan","Seleccionado","Carta Oferta","Envio carta Oferta","Firma Carta Oferta","Fecha Ingreso","Reclutador","Proceso","Prioridad","Bloqueado por","Próxima acción","Fecha próxima acción","Observaciones","Última actualización"],
      };
      const reclEjemplos = [
        ["","Interno","Planta Bio Bio","Cosecha","Enero","Gloria","Sí","Sí","En proceso","Sí","Agendada","Agendada","Solicitado","Solicitado","Sí","Solicitada","Realizado","Sí","","Gloria","Abierto","P2 Alto","Sin bloqueo","Confirmar fecha ingreso","","Proceso avanzado",""],
        ["","Externo","Planta Freire","Reemplazo","Febrero","Hernan","No","No","Finalizado","No","Realizada","Realizada","Realizado","Realizado","No","N/A","Pendiente","No","","Matías","Cerrado","P3 Medio","Sin bloqueo","","","Candidato desistió",""],
        ["","Promoción interna","Planta Perquenco","Fijo","Marzo","Pendiente","Confidencial","","","","Pendiente","Pendiente","Pendiente","Pendiente","","Pendiente","N/A","Pendiente","","Katalina","Pausado","P2 Alto","Falta aprobación","Esperar aprobación PPTO","","En espera de presupuesto",""],
      ];
      Object.entries(sheets).forEach(([sheetName, headers]) => {
        const rows: any[][] = [headers];
        if (sheetName === "Reclutamiento") reclEjemplos.forEach(r => rows.push(r));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
      });
      XLSX.writeFile(wb, "Plantilla_TotalControlRH.xlsx");
      toastShow("Plantilla XLSX descargada", { type: "success" });
    } finally { setExporting(null); }
  };

  // ── PARSE XLSX FILE ─────────────────────────

  const parseXlsxFile = async (file: File): Promise<XlsxParseResult> => {
    const MAX_FILE_MB = 10;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toastShow("Archivo demasiado grande", { type: "warning", message: `El archivo supera los ${MAX_FILE_MB} MB permitidos.` });
      return { hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: true };
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toastShow("Formato inválido", { type: "warning", message: "Solo se aceptan archivos .xlsx o .xls." });
      return { hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: true };
    }
    const buffer = await file.arrayBuffer();
    const XLSX = await getXlsx();
    const wb = XLSX.read(buffer, { type: "array", cellDates: false });
    const result: XlsxParseResult = { hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: false };
    let contactosActualizados = [...data.contactos];

    const getSheet = (names: string[]): any => {
      for (const n of names) {
        const found = wb.SheetNames.find((s: string) => s.trim().toLowerCase() === n.toLowerCase());
        if (found) return wb.Sheets[found];
      }
      return null;
    };

    const processSheet = (sheetNames: string[], modulo: string, processor: (rows: any[]) => { registros: any[]; erroresList: string[]; advertenciasList: string[] }) => {
      const ws = getSheet(sheetNames);
      if (!ws) return;
      const rows = xlsxSheetToObjects(ws, XLSX.utils).filter((r: any) => Object.values(r).some((v: any) => v !== "" && v !== null && v !== undefined));
      if (!rows.length) return;
      const { registros, erroresList, advertenciasList } = processor(rows);
      const validos = registros.filter((r: any) => !r._hasError).length;
      const conError = registros.filter((r: any) => r._hasError).length;
      const advertencias = advertenciasList.length;
      if (conError > 0) result.tieneErroresCriticos = true;
      result.hojas.push({ nombre: sheetNames[0], modulo, total: rows.length, validos, errores: conError, advertencias, registros, erroresList, advertenciasList });
      (result.parsedData as any)[modulo] = registros.filter((r: any) => !r._hasError).map((r: any) => { const clean = { ...r }; delete clean._hasError; delete clean._hasWarning; delete clean._errorMsg; return clean; });
    };

    processSheet(["Contactos"], "contactos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const nombre = String(row["Nombre"] || "").trim();
        if (!nombre) { erroresList.push(`Fila ${i+2}: Nombre obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        registros.push({ id: String(row["ID"] || `contacto_${Date.now()}_${i}`), nombre, rol: String(row["Rol"] || ""), areaEmpresa: String(row["Área / Empresa"] || ""), correo: String(row["Correo"] || ""), telefono: String(row["Teléfono"] || ""), relacion: String(row["Relación"] || "Externo"), activo: String(row["Activo"] || "Sí"), observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Cursos"], "cursos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const curso = String(row["Curso / Capacitación"] || "").trim();
        if (!curso) { erroresList.push(`Fila ${i+2}: Nombre del curso obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `curso_${Date.now()}_${i}`), curso, origen: String(row["Origen"] || "DNC"), area: String(row["Área"] || ""), solicitante: String(row["Solicitante"] || ""), fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]), fechaRequerida: normalizeDateFromXlsx(row["Fecha requerida"]), estado: String(row["Estado"] || "Pendiente revisar"), prioridad: String(row["Prioridad"] || "P3 Medio"), nivelCritico: String(row["Nivel crítico"] || "Medio"), requiereOC: String(row["Requiere OC"] || "No"), numeroOC: String(row["N° OC asociada"] || ""), proveedor: String(row["Proveedor / OTEC"] || ""), responsableId: respId, proximaAccion: String(row["Próxima acción"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["OCs"], "ocs", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const numeroOC = String(row["N° OC"] || "").trim();
        if (!numeroOC) { erroresList.push(`Fila ${i+2}: N° OC obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        const monto = parseXlsxMoney(row["Monto"]);
        if (monto < 0) advertenciasList.push(`Fila ${i+2}: Monto negativo (${monto})`);
        registros.push({ id: String(row["ID"] || `oc_${Date.now()}_${i}`), numeroOC, categoriaOC: String(row["Categoría OC"] || "Curso / Capacitación"), cursoAsociado: String(row["Curso / Servicio asociado"] || ""), proveedor: String(row["Proveedor"] || ""), monto, fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]), fechaLimite: normalizeDateFromXlsx(row["Fecha límite"]), estadoOC: String(row["Estado OC"] || "Solicitada"), prioridad: String(row["Prioridad"] || "P3 Medio"), accionPendiente: String(row["Acción pendiente"] || ""), responsableId: respId, bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: monto < 0 });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Practicantes"], "practicantes", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const nombre = String(row["Nombre"] || "").trim();
        if (!nombre) { erroresList.push(`Fila ${i+2}: Nombre obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `prac_${Date.now()}_${i}`), nombre, area: String(row["Área"] || ""), especialidad: String(row["Especialidad"] || ""), fechaInicio: normalizeDateFromXlsx(row["Fecha inicio"]), fechaTermino: normalizeDateFromXlsx(row["Fecha término"]), costoMensual: parseXlsxMoney(row["Costo mensual"]), estado: String(row["Estado"] || "Activo"), responsableId: respId, proximoPaso: String(row["Próximo paso"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Presupuesto"], "presupuesto", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const concepto = String(row["Área / Módulo"] || row["Concepto"] || "").trim();
        if (!concepto) { erroresList.push(`Fila ${i+2}: Concepto/Área obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `ppto_${Date.now()}_${i}`), concepto, presupuestoTotal: parseXlsxMoney(row["Presupuesto asignado"] || row["Presupuesto total"]), gastado: parseXlsxMoney(row["Monto ejecutado manual"] || row["Gastado"]), responsableId: respId, ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Procesos Pendientes", "Procesos"], "procesos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const proceso = String(row["Proceso"] || "").trim();
        if (!proceso) { erroresList.push(`Fila ${i+2}: Proceso obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `proc_${Date.now()}_${i}`), proceso, tipo: String(row["Tipo"] || "Administrativo"), estadoActual: String(row["Estado actual"] || "Pendiente"), queFalta: String(row["Qué falta"] || ""), responsableId: respId, fechaLimite: normalizeDateFromXlsx(row["Fecha límite"]), riesgo: String(row["Riesgo si no se hace"] || ""), prioridad: String(row["Prioridad"] || "P3 Medio"), proximaAccion: String(row["Próxima acción"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Diplomas BUK", "Diplomas"], "diplomas", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const participante = String(row["Participante"] || "").trim();
        const cursoAsociado = String(row["Curso asociado"] || "").trim();
        if (!participante || !cursoAsociado) { erroresList.push(`Fila ${i+2}: Participante y Curso asociado obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `dip_${Date.now()}_${i}`), cursoAsociado, participante, tipoDocumento: String(row["Tipo documento"] || "Diploma"), otec: String(row["OTEC / proveedor"] || ""), etapa: String(row["Etapa"] || "Pedir a la OTEC"), fechaSolicitudOTEC: normalizeDateFromXlsx(row["Fecha solicitud a OTEC"]), fechaRecepcionDoc: normalizeDateFromXlsx(row["Fecha recepción documento"]), fechaEnvioParticipante: normalizeDateFromXlsx(row["Fecha envío al participante"]), fechaSubidaBUK: normalizeDateFromXlsx(row["Fecha subida a BUK"]), estadoBUK: String(row["Estado BUK"] || "Pendiente subir"), prioridad: String(row["Prioridad"] || "P3 Medio"), responsableId: respId, proximaAccion: String(row["Próxima acción"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Evaluaciones Psicolaborales", "Evaluaciones"], "evaluacionesPsicolaborales", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const cargo = String(row["Cargo"] || "").trim();
        if (!cargo) { erroresList.push(`Fila ${i+2}: Cargo obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `eval_${Date.now()}_${i}`), mes: String(row["Mes"] || ""), ano: parseXlsxNumber(row["Año"]) || new Date().getFullYear(), cargo, area: String(row["Área"] || ""), candidato: String(row["Candidato"] || ""), rut: String(row["RUT candidato"] || ""), tipoEvaluacion: String(row["Tipo evaluación"] || "Psicolaboral"), proveedor: String(row["Proveedor / Psicólogo"] || ""), fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]), fechaEvaluacion: normalizeDateFromXlsx(row["Fecha evaluación"]), fechaEntregaInforme: normalizeDateFromXlsx(row["Fecha entrega informe"]), estado: String(row["Estado"] || "Pendiente solicitar"), resultado: String(row["Resultado"] || "Pendiente"), prioridad: String(row["Prioridad"] || "P3 Medio"), responsableId: respId, costo: parseXlsxMoney(row["Costo"]), requiereOC: String(row["Requiere OC"] || "No"), numeroOC: String(row["N° OC asociada"] || ""), proximaAccion: String(row["Próxima acción"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Carga Semanal"], "cargaSemanal", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const semana = String(row["Semana"] || "").trim();
        if (!semana) { erroresList.push(`Fila ${i+2}: Semana obligatoria`); registros.push({ ...row, _hasError: true }); return; }
        registros.push({ id: String(row["ID"] || `carga_${Date.now()}_${i}`), semana, cursosPlanificados: parseXlsxNumber(row["Cursos planificados"]), cursosUrgentesNuevos: parseXlsxNumber(row["Cursos urgentes nuevos"]), cursosNoPlanificados: parseXlsxNumber(row["Cursos no planificados necesarios"]), ocsNuevas: parseXlsxNumber(row["OCs nuevas"]), diplomasPendientes: parseXlsxNumber(row["Diplomas pendientes"]), procesosBloqueados: parseXlsxNumber(row["Procesos bloqueados"]), comentario: String(row["Comentario"] || ""), _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Vales de Gas Colaboradores", "Vales de Gas"], "valesGas", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const colaborador = String(row["Colaborador"] || "").trim();
        const area = String(row["Área"] || "").trim();
        const periodo = String(row["Periodo"] || "").trim();
        if (!colaborador || !area || !periodo) { erroresList.push(`Fila ${i+2}: Colaborador, Área y Periodo son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const asignados = parseXlsxNumber(row["Vales asignados al colaborador"] || row["Total vales asignados"]);
        const usados = parseXlsxNumber(row["Vales entregados / utilizados"] || row["Vales usados"]);
        const descDiario = parseXlsxNumber(row["Descuento diario"]);
        const diasDesc = parseXlsxNumber(row["Días descuento"]);
        const hasWarn = usados > asignados;
        if (hasWarn) advertenciasList.push(`Fila ${i+2}: Vales utilizados (${usados}) > asignados (${asignados})`);
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `valegas_${Date.now()}_${i}`), colaborador, contactoId: String(row["Contacto asociado"] || ""), area, periodo, fechaEntrega: normalizeDateFromXlsx(row["Fecha entrega"]), totalValesAsignados: asignados, valesUsados: usados, saldoVales: Math.max(0, asignados - usados), descuentoDiario: descDiario, diasDescuento: diasDesc, totalDescontado: descDiario * diasDesc, estado: String(row["Estado"] || "Pendiente entregar"), responsableId: respId, fechaProximaRevision: normalizeDateFromXlsx(row["Fecha próxima revisión"]), ultimaActualizacion: new Date().toISOString().split("T")[0], observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: hasWarn });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Vales Gas Organización", "Vales Gas Organizacion"], "valesGasOrganizacion", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const fechaRegistro = normalizeDateFromXlsx(row["Fecha registro"]);
        const periodo = String(row["Periodo"] || "").trim();
        const tipoMovimiento = String(row["Tipo movimiento"] || "").trim();
        const cantidad = parseXlsxNumber(row["Cantidad vales"]);
        if (!fechaRegistro || !periodo || !tipoMovimiento || cantidad <= 0) { erroresList.push(`Fila ${i+2}: Fecha, Periodo, Tipo movimiento y Cantidad (>0) son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({ id: String(row["ID"] || `valegasorg_${Date.now()}_${i}`), fechaRegistro, periodo, tipoMovimiento, cantidadVales: cantidad, motivo: String(row["Motivo"] || ""), responsableId: respId, observaciones: String(row["Observaciones"] || ""), ultimaActualizacion: normalizeDateFromXlsx(row["Última actualización"]) || new Date().toISOString().split("T")[0], _hasError: false, _hasWarning: false });
      });
      return { registros, erroresList, advertenciasList };
    });

    processSheet(["Reclutamiento", "Hoja1", "RECLUTAMIENTO", "Reclutamiento RRHH"], "reclutamiento", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const plantaCentro = String(row["Planta o Centro"] || "").trim();
        const tipoVacante = String(row["Tipo de vacante"] || "").trim();
        const mesIngreso = String(row["Mes ingreso"] || "").trim();
        const proceso = normalizeReclutamientoCampo(row["Proceso"], "proceso");
        if (!plantaCentro || !tipoVacante || !mesIngreso || !proceso) { erroresList.push(`Fila ${i+2}: Planta, Tipo vacante, Mes ingreso y Proceso son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const reclutadorNombre = String(row["Reclutador"] || "").trim();
        let reclutadorId = "";
        if (reclutadorNombre) {
          const { id, contactosActualizados: ca } = resolveResponsable(reclutadorNombre, contactosActualizados, "RRHH");
          reclutadorId = id; contactosActualizados = ca;
        }
        const hasWarn = proceso === "Pausado" && (!row["Bloqueado por"] || row["Bloqueado por"] === "Sin bloqueo");
        if (hasWarn) advertenciasList.push(`Fila ${i+2}: Proceso Pausado sin bloqueo definido`);
        registros.push({ id: String(row["ID"] || `recl_${Date.now()}_${i}`), reclutamiento: normalizeReclutamientoCampo(row["Reclutamiento"], "reclutamiento"), plantaCentro, tipoVacante, mesIngreso, revisadoPPTO: String(row["Revisado PPTO"] || ""), procesoBuk: normalizeReclutamientoCampo(row["Proceso en BUK"], "procesoBuk"), publicado: normalizeReclutamientoCampo(row["Publicado"], "publicado"), seleccionCV: String(row["Selección de CV"] || ""), cvSeleccionadoBuk: normalizeReclutamientoCampo(row["CV Seleccionado en BUK"], "cvSeleccionadoBuk"), entrevistaJefatura: String(row["Entrevista Jefatura"] || ""), entrevistaGP: String(row["Entrevista GP"] || ""), testPsicolaboral: String(row["Test Psicolaboral"] || ""), testHogan: String(row["Test Hogan"] || ""), seleccionado: normalizeReclutamientoCampo(row["Seleccionado"], "seleccionado"), cartaOferta: String(row["Carta Oferta"] || ""), envioCartaOferta: String(row["Envio carta Oferta"] || row["Envío carta oferta"] || ""), firmaCartaOferta: normalizeReclutamientoCampo(row["Firma Carta Oferta"], "firmaCartaOferta"), fechaIngreso: normalizeDateFromXlsx(row["Fecha Ingreso"] || row["Fecha ingreso"]), reclutador: reclutadorNombre, proceso, reclutadorId, prioridad: String(row["Prioridad"] || "P3 Medio"), bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"), proximaAccion: String(row["Próxima acción"] || ""), fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]), observaciones: String(row["Observaciones"] || ""), ultimaActualizacion: normalizeDateFromXlsx(row["Última actualización"]) || new Date().toISOString().split("T")[0], _hasError: false, _hasWarning: hasWarn });
      });
      return { registros, erroresList, advertenciasList };
    });

    result.contactosNuevos = contactosActualizados.filter((c: any) => !data.contactos.find((existing: any) => existing.id === c.id));
    return result;
  };

  // ── DATOS ───────────────────────────────────

  const restaurarEjemplos = () => {
    setConfirm({
      title: "Restaurar datos de ejemplo",
      message: "Se perderán los datos actuales y se reemplazarán por datos de ejemplo.",
      variant: "warning", confirmLabel: "Restaurar",
      onConfirm: () => {
        logAudit("backup:restore", { detail: "Restaurar datos de ejemplo" });
        runBackupAndToast("restaurar");
        limpiarDatos();
        setData(crearDatosEjemplo());
        toastShow("Datos de ejemplo restaurados", { type: "success" });
        setConfirm(null);
      },
    });
  };

  const limpiarTodo = () => {
    setConfirm({
      title: "Eliminar todos los datos",
      message: "Esta acción no se puede deshacer. Se creará un respaldo antes de limpiar.",
      variant: "warning", confirmLabel: "Continuar",
      onConfirm: () => {
        setConfirm({
          title: "Confirmación final",
          message: "Se borrará todo definitivamente. ¿Deseas continuar?",
          variant: "danger", confirmLabel: "Eliminar definitivamente",
          onConfirm: () => {
            logAudit("record:delete", { detail: "Limpiar todos los datos del sistema" });
            runBackupAndToast("limpiar");
            limpiarDatos();
            setData({ ...crearDatosEjemplo(), cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [], diplomas: [], cargaSemanal: [], contactos: [], evaluacionesPsicolaborales: [], valesGas: [], valesGasOrganizacion: [], reclutamiento: [] });
            toastShow("Todos los datos eliminados", { type: "success" });
            setConfirm(null);
          },
        });
      },
    });
  };

  return {
    exporting, lastJSONExport, lastXLSXExport,
    canExportFull, canExportSummary, canExportAnonymized,
    exportJSON, exportJSONSummary, exportJSONAnonymized, importJSON,
    exportXLSX, exportXLSXAnonymized, exportLimpia, downloadXlsxTemplate,
    parseXlsxFile, restaurarEjemplos, limpiarTodo,
  };
}
