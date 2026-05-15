import React, { memo, useEffect, useState } from "react";
import { AlertTriangle, Check, ClipboardList, Copy, Lightbulb, Lock, RefreshCw, Settings, Shuffle, Users, XCircle } from "lucide-react";
import { getUserWorkspace, getWorkspaceMembers, type Workspace, type WorkspaceMember } from "../backend/supabaseWorkspace";
import { SUPABASE_CONFIGURED } from "../backend/supabaseClient";
import { WorkspaceSetup } from "../components/ui/WorkspaceSetup";
import { UserManager } from "../components/ui/UserManager";
import { getSession } from "../auth/authService";
import type { ConfirmState } from "../shared/formTypes";
import type { AppData, BackupItem } from "../domain/types";
import type { XlsxParseResult } from "../importExport/xlsxImport";
import { saveLocalBackups } from "../storage/backupStorage";
import { logAudit } from "../audit/auditService";
import { ConfirmDialog, ExpandableSection, LoadingSpinner, ModuleHeader } from "../components/ui";
function XlsxImportPreview({ parseResult, onConfirmReplace, onConfirmMerge, onCancel, loading }: {
  parseResult: XlsxParseResult;
  onConfirmReplace: () => void;
  onConfirmMerge: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const totalRegistros = parseResult.hojas.reduce((s, h) => s + h.total, 0);
  const totalErrores = parseResult.hojas.reduce((s, h) => s + h.errores, 0);
  const totalAdv = parseResult.hojas.reduce((s, h) => s + h.advertencias, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-blue-600" />Previsualización de importación XLSX</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revisa los datos antes de confirmar la importación.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-xl">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Paso visual: stepper */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div><span className="font-medium text-emerald-700">Plantilla descargada</span></div>
            <div className="flex-1 h-px bg-emerald-200" />
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div><span className="font-medium text-emerald-700">Archivo cargado</span></div>
            <div className="flex-1 h-px bg-emerald-200" />
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</div><span className="font-medium text-blue-700">Revisar y confirmar</span></div>
          </div>

          {/* KPIs resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">{totalRegistros}</div>
              <div className="text-xs text-slate-500 mt-1">Registros detectados</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalErrores > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className={`text-2xl font-bold ${totalErrores > 0 ? "text-red-600" : "text-emerald-600"}`}>{totalErrores}</div>
              <div className="text-xs text-slate-500 mt-1">Errores críticos</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalAdv > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
              <div className={`text-2xl font-bold ${totalAdv > 0 ? "text-amber-600" : "text-slate-400"}`}>{totalAdv}</div>
              <div className="text-xs text-slate-500 mt-1">Advertencias</div>
            </div>
          </div>

          {parseResult.tieneErroresCriticos && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <div className="text-sm text-red-700">
                <span className="font-semibold">Hay errores críticos.</span> Solo se importarán los registros válidos. Los registros con errores serán omitidos.
              </div>
            </div>
          )}

          {/* Tabla por hoja */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Hoja / Módulo","Total","Válidos","Advertencias","Errores"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parseResult.hojas.map((h, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{h.nombre}</td>
                    <td className="px-4 py-2.5 text-slate-600">{h.total}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-medium">{h.validos}</td>
                    <td className="px-4 py-2.5">{h.advertencias > 0 ? <span className="text-amber-600 font-medium">{h.advertencias}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5">{h.errores > 0 ? <span className="text-red-600 font-medium">{h.errores}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalle de errores/advertencias */}
          {parseResult.hojas.some(h => h.erroresList.length > 0 || h.advertenciasList.length > 0) && (
            <div className="space-y-2">
              {parseResult.hojas.filter(h => h.erroresList.length > 0).map((h, i) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5"><XCircle size={14} />{h.nombre} — Errores ({h.erroresList.length})</div>
                  <ul className="space-y-0.5">{h.erroresList.slice(0, 10).map((e, j) => <li key={j} className="text-xs text-red-600">· {e}</li>)}</ul>
                  {h.erroresList.length > 10 && <p className="text-xs text-red-400 mt-1">… y {h.erroresList.length - 10} más</p>}
                </div>
              ))}
              {parseResult.hojas.filter(h => h.advertenciasList.length > 0).map((h, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5"><AlertTriangle size={14} />{h.nombre} — Advertencias ({h.advertenciasList.length})</div>
                  <ul className="space-y-0.5">{h.advertenciasList.slice(0, 5).map((e, j) => <li key={j} className="text-xs text-amber-700">· {e}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-blue-700">
            <Lock size={16} className="shrink-0" />
            <span>Se creará un respaldo automático antes de importar. Las hojas no presentes en el XLSX mantendrán sus datos actuales intactos.</span>
          </div>
        </div>

        {/* Footer con modos */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3 justify-end flex-wrap">
            <button onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button
              onClick={onConfirmMerge}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? "Procesando importación..." : <span className="inline-flex items-center gap-2"><Shuffle size={14} />Fusionar con base actual</span>}
            </button>
            <button
              onClick={onConfirmReplace}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? "Procesando importación..." : <span className="inline-flex items-center gap-2"><RefreshCw size={14} />Reemplazar base actual</span>}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">
            <strong>Fusionar:</strong> actualiza existentes, agrega nuevos. <strong>Reemplazar:</strong> borra módulos del XLSX y recarga.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuloConfiguracion({
  data, exportJSON, exportJSONSummary, exportJSONAnonymized, importJSON, exportXLSX, exportXLSXAnonymized, exportLimpia,
  restaurarEjemplos, limpiarTodo, showInstructions,
  backups, setBackups, lastJSONExport, lastXLSXExport, runBackupAndToast, setData, toastShow,
  downloadXlsxTemplate, parseXlsxFile, canExportFull, canExportSummary, canExportAnonymized,
  encryptionEnabled, openEncryptionSetup, disableEncryption, exporting
}: any) {
  const counts: Record<string, number> = {
    cursos: data.cursos.length,
    ocs: data.ocs.length,
    practicantes: data.practicantes.length,
    presupuesto: data.presupuesto.length,
    procesos: data.procesos.length,
    diplomas: data.diplomas.length,
    evaluacionesPsicolaborales: data.evaluacionesPsicolaborales.length,
    cargaSemanal: data.cargaSemanal.length,
    contactos: data.contactos.length
  };

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showJoinSetup, setShowJoinSetup] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    getUserWorkspace().then(r => { if (r.ok && r.data) setWorkspace(r.data); });
    getWorkspaceMembers().then(r => { if (r.ok) setMembers(r.data); });
  }, []);

  const handleCopyCode = () => {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.invite_code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };
  const [xlsxParseResult, setXlsxParseResult] = useState<XlsxParseResult | null>(null);
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const [xlsxApplying, setXlsxApplying] = useState(false);
  const xlsxFileInputRef = React.useRef<HTMLInputElement>(null);
  const exportingXlsx = exporting === "xlsx" || exporting === "xlsxAnon";
  const exportingJson = exporting === "json" || exporting === "jsonSummary" || exporting === "jsonAnon";
  const exportingTemplate = exporting === "template";
  const exportingCleanTemplate = exporting === "cleanTemplate";

  const handleXlsxFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxImporting(true);
    try {
      const result = await parseXlsxFile(file);
      setXlsxParseResult(result);
    } catch {
      toastShow("Error al leer el archivo XLSX", {
        type: "error",
        message: "Verifica que el archivo sea válido.",
      });
    } finally {
      setXlsxImporting(false);
      if (xlsxFileInputRef.current) xlsxFileInputRef.current.value = "";
    }
  };

  const applyXlsxImport = (mode: "merge" | "replace") => {
    if (!xlsxParseResult) return;
    setXlsxApplying(true);
    try {
      logAudit("data:import", { detail: `Importación XLSX modo ${mode}` });
      runBackupAndToast("importar-xlsx");
      const parsed = xlsxParseResult.parsedData;
      const newData = { ...data };
      const modules: (keyof AppData)[] = ["contactos","cursos","ocs","practicantes","presupuesto","procesos","diplomas","evaluacionesPsicolaborales","cargaSemanal","valesGas","valesGasOrganizacion","reclutamiento"];
      modules.forEach(mod => {
        if (!(mod in parsed)) return;
        const incoming = (parsed as any)[mod] as any[];
        if (mode === "replace") {
          (newData as any)[mod] = incoming;
        } else {
          const existing = (newData as any)[mod] as any[];
          const merged = [...existing];
          incoming.forEach((item: any) => {
            const idx = merged.findIndex((e: any) => e.id === item.id);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
            else merged.push(item);
          });
          (newData as any)[mod] = merged;
        }
      });
      if (mode === "merge" && xlsxParseResult.contactosNuevos.length > 0) {
        const existingIds = new Set(newData.contactos.map((c: any) => c.id));
        xlsxParseResult.contactosNuevos.forEach((c: any) => {
          if (!existingIds.has(c.id)) newData.contactos.push(c);
        });
      }
      newData.meta = { ...newData.meta, actualizado: new Date().toISOString() };
      setData(newData);
      setXlsxParseResult(null);
      const hojas = xlsxParseResult.hojas.length;
      const total = xlsxParseResult.hojas.reduce((s, h) => s + h.validos, 0);
      toastShow("XLSX importado correctamente", {
        type: "success",
        message: `${total} registros en ${hojas} módulos (modo: ${mode === "merge" ? "fusión" : "reemplazo"}).`,
      });
    } finally {
      setXlsxApplying(false);
    }
  };

  const confirmXlsxImport = (mode: "merge" | "replace") => {
    const label = mode === "merge" ? "Fusionar" : "Reemplazar";
    setConfirm({
      title: `Confirmar importación XLSX (${label})`,
      message: mode === "merge"
        ? "Se fusionarán registros existentes y se crearán nuevos. Se generará un respaldo antes de importar."
        : "Se reemplazarán los módulos presentes en el XLSX. Se generará un respaldo antes de importar.",
      variant: "warning",
      confirmLabel: "Importar",
      onConfirm: () => {
        applyXlsxImport(mode);
        setConfirm(null);
      },
    });
  };

  const handleRestaurarBackup = (backup: BackupItem) => {
    setConfirm({
      title: "Restaurar respaldo",
      message: `¿Restaurar respaldo del ${new Date(backup.fecha).toLocaleString("es-CL")}? Se creará un respaldo de seguridad antes de restaurar.`,
      variant: "warning",
      confirmLabel: "Restaurar",
      onConfirm: () => {
        runBackupAndToast("antes de restaurar");
        if (backup.data && typeof backup.data === "object") {
          setData(backup.data);
          toastShow("Respaldo restaurado exitosamente", { type: "success" });
        } else {
          toastShow("Respaldo corrupto o inválido", { type: "error" });
        }
        setConfirm(null);
      },
    });
  };

  const handleDescargarBackup = (backup: BackupItem) => {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `respaldo_local_kata_${new Date(backup.fecha).toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("JSON de respaldo descargado", { type: "success" });
  };

  const handleEliminarBackup = (id: string) => {
    setConfirm({
      title: "Eliminar respaldo",
      message: "¿Seguro que deseas eliminar este respaldo local de forma permanente?",
      variant: "danger",
      confirmLabel: "Eliminar",
      onConfirm: () => {
        const updated = backups.filter((b: BackupItem) => b.id !== id);
        saveLocalBackups(updated);
        setBackups(updated);
        toastShow("Respaldo eliminado", { type: "success" });
        setConfirm(null);
      },
    });
  };

  const handleCrearBackupManual = () => {
    runBackupAndToast("manual");
    toastShow("Respaldo manual creado correctamente", { type: "success" });
  };

  const lastLocalBackupDate = backups[0]?.fecha;

  return (
    <div className="space-y-4">
      <ModuleHeader
        icon={<Settings size={20} className="text-white" />}
        gradient="from-slate-500 to-slate-600"
        title="Configuración y Respaldos"
        subtitle="Gestión de datos, exportación, importación y respaldos del sistema."
      />

      {/* ── Acordeón 1: Importar / Exportar ── */}
      <ExpandableSection title="Importar / Exportar datos" defaultOpen={true}>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
            <Lightbulb size={16} className="shrink-0 text-blue-600" />
            <p className="text-sm text-blue-700">Descarga un respaldo JSON al menos 1 vez por semana y guárdalo en una carpeta segura.</p>
          </div>

          <input ref={xlsxFileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleXlsxFileSelect} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Paso 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                <p className="text-sm font-semibold text-slate-700">Descargar plantilla</p>
              </div>
              <p className="text-xs text-slate-500">Plantilla oficial con todos los módulos y ejemplos incluidos.</p>
              <button onClick={downloadXlsxTemplate} disabled={exportingTemplate} className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                {exportingTemplate ? "Generando..." : "Descargar plantilla XLSX"}
              </button>
            </div>
            {/* Paso 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">2</span>
                <p className="text-sm font-semibold text-slate-700">Importar base XLSX</p>
              </div>
              <p className="text-xs text-slate-500">Sube tu archivo, previsualiza los datos y elige modo: fusionar o reemplazar.</p>
              <button onClick={() => xlsxFileInputRef.current?.click()} disabled={xlsxImporting} className="w-full bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {xlsxImporting ? "Procesando..." : "Subir e importar XLSX"}
              </button>
              {xlsxImporting && <div className="flex justify-center"><LoadingSpinner size="sm" label="Procesando..." /></div>}
            </div>
            {/* Paso 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">3</span>
                <p className="text-sm font-semibold text-slate-700">Exportar datos</p>
              </div>
              <p className="text-xs text-slate-500">Descarga el XLSX completo o una versión anonimizada para compartir.</p>
              <div className="space-y-2">
                {canExportFull && (
                  <button onClick={exportXLSX} disabled={exportingXlsx} className="w-full bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                    {exporting === "xlsx" ? "Generando XLSX..." : "Exportar XLSX completo"}
                  </button>
                )}
                {canExportAnonymized && (
                  <button onClick={exportXLSXAnonymized} disabled={exportingXlsx} className="w-full bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60">
                    {exporting === "xlsxAnon" ? "Generando..." : "Exportar XLSX anon."}
                  </button>
                )}
                {!canExportFull && !canExportAnonymized && <p className="text-[11px] text-slate-400">Sin permisos de exportación</p>}
              </div>
              {exportingXlsx && <div className="flex justify-center"><LoadingSpinner size="sm" label="Generando XLSX..." /></div>}
            </div>
          </div>
          <p className="text-xs text-slate-400">Modos al importar: <strong>Fusionar</strong> agrega/actualiza sin borrar · <strong>Reemplazar</strong> sobreescribe los módulos presentes en el archivo.</p>
        </div>
      </ExpandableSection>

      {/* ── Acordeón 2: Respaldos ── */}
      <ExpandableSection title="Respaldos locales" count={backups.length} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estado */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100"><span>Último respaldo local</span><span className="font-semibold text-slate-800">{lastLocalBackupDate ? new Date(lastLocalBackupDate).toLocaleString("es-CL") : "Ninguno"}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span>Última descarga JSON</span><span className="font-semibold text-slate-800">{lastJSONExport ? new Date(lastJSONExport).toLocaleString("es-CL") : "Nunca"}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span>Última descarga XLSX</span><span className="font-semibold text-slate-800">{lastXLSXExport ? new Date(lastXLSXExport).toLocaleString("es-CL") : "Nunca"}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span>Última actualización</span><span className="font-semibold text-slate-800">{new Date(data.meta.actualizado).toLocaleString("es-CL")}</span></div>
              <div className="flex justify-between py-1"><span>Versión</span><span className="font-semibold text-slate-800">v{data.meta.version}</span></div>
            </div>
            {/* Acciones JSON */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Exportar / Importar JSON</p>
              <div className="flex flex-wrap gap-2">
                {canExportFull && (
                  <button onClick={exportJSON} disabled={exportingJson} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                    {exporting === "json" ? "Generando..." : "Exportar JSON completo"}
                  </button>
                )}
                {canExportSummary && (
                  <button onClick={exportJSONSummary} disabled={exportingJson} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60">
                    {exporting === "jsonSummary" ? "Generando..." : "Exportar resumen"}
                  </button>
                )}
                {canExportAnonymized && (
                  <button onClick={exportJSONAnonymized} disabled={exportingJson} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60">
                    {exporting === "jsonAnon" ? "Generando..." : "Exportar JSON anon."}
                  </button>
                )}
                <button onClick={importJSON} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">Importar JSON</button>
                <button onClick={exportLimpia} disabled={exportingCleanTemplate} className="bg-slate-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-600 transition disabled:opacity-60">
                  {exportingCleanTemplate ? "Generando..." : "Plantilla limpia"}
                </button>
              </div>
              {exportingJson && <div className="flex justify-center mt-2"><LoadingSpinner size="sm" label="Generando exportación..." /></div>}
            </div>
          </div>

          {/* Tabla de respaldos */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Historial de respaldos automáticos (hasta 10)</p>
            <button onClick={handleCrearBackupManual} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
              Crear respaldo ahora
            </button>
          </div>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Aún no hay respaldos locales</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-medium">
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Motivo</th>
                    <th className="px-4 py-2">Tamaño</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup: BackupItem) => (
                    <tr key={backup.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-slate-700 font-medium text-xs">{new Date(backup.fecha).toLocaleString("es-CL")}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          backup.motivo === "manual" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          backup.motivo === "importar" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          backup.motivo === "eliminar" ? "bg-red-50 text-red-700 border border-red-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>{backup.motivo}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-xs">{backup.tamaño}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleRestaurarBackup(backup)} className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">Restaurar</button>
                          <button onClick={() => handleDescargarBackup(backup)} className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">Descargar</button>
                          <button onClick={() => handleEliminarBackup(backup.id)} className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* ── Acordeón 3: Trabajo en equipo ── */}
      {SUPABASE_CONFIGURED && (
        <ExpandableSection title="Trabajo en equipo" defaultOpen={true}>
          {workspace ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Info del workspace */}
                <div className="flex-1 min-w-48 space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Equipo actual</p>
                  <p className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    {workspace.name}
                  </p>
                </div>

                {/* Código de invitación */}
                <div className="flex-1 min-w-48 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Código de invitación</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 font-mono text-lg font-bold tracking-widest text-slate-800 select-all">
                      {workspace.invite_code}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {codeCopied ? <><Check size={14} className="text-emerald-600" />Copiado</> : <><Copy size={14} />Copiar</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Comparte este código para que otros usuarios se unan a tu equipo.</p>
                </div>
              </div>

              {members.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Miembros del equipo</p>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center uppercase">
                          {m.display_name.slice(0, 1)}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{m.display_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${m.role === "owner" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                          {m.role === "owner" ? "Dueño" : "Editor"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => setShowJoinSetup(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Unirme a otro equipo con un código
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-2">Cargando información del equipo…</div>
          )}

          {showJoinSetup && (
            <WorkspaceSetup
              onReady={ws => { setWorkspace(ws); setShowJoinSetup(false); }}
            />
          )}
        </ExpandableSection>
      )}

      {/* ── Acordeón 4: Usuarios ── */}
      {SUPABASE_CONFIGURED && getSession()?.role === "admin" && (
        <ExpandableSection title="Gestión de usuarios" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Administra quién puede acceder a la aplicación. Los cambios aplican en todos los dispositivos de inmediato.
            </p>
            <UserManager currentUsername={getSession()?.username ?? ""} />
          </div>
        </ExpandableSection>
      )}

      {/* ── Acordeón 5: Sistema ── */}
      <ExpandableSection title="Sistema y seguridad">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cifrado */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cifrado local</p>
            <p className="text-sm text-slate-600">Protege datos sensibles en este navegador con una clave local.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Estado:</span>
              <span className={`text-xs font-semibold ${encryptionEnabled ? "text-emerald-600" : "text-slate-500"}`}>{encryptionEnabled ? "Activo" : "Desactivado"}</span>
            </div>
            {!encryptionEnabled
              ? <button onClick={openEncryptionSetup} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Activar cifrado</button>
              : <button onClick={disableEncryption} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition">Desactivar cifrado</button>
            }
            <p className="text-[11px] text-slate-400">La clave se solicita al iniciar y no se guarda en localStorage.</p>
          </div>

          {/* Registros */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registros por módulo</p>
            <div className="space-y-1">
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-xs py-0.5">
                  <span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded ${v > 0 ? "bg-blue-50 text-blue-700" : "text-slate-400"}`}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-700">Total</span>
                <span className="text-slate-800">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
              </div>
            </div>
          </div>

          {/* Guía */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guía de uso</p>
            <p className="text-sm text-slate-600">Consulta las instrucciones completas, rutina semanal y buenas prácticas.</p>
            <button onClick={showInstructions} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition">Ver instrucciones de uso</button>
          </div>

          {/* Zona peligro */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Datos y zona de peligro</p>
            <p className="text-sm text-slate-600">Restaura datos de ejemplo o elimina todo permanentemente.</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={restaurarEjemplos} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition">Restaurar ejemplos</button>
              <button onClick={limpiarTodo} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 transition">Limpiar todos los datos</button>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {xlsxParseResult && (
        <XlsxImportPreview
          parseResult={xlsxParseResult}
          onConfirmMerge={() => confirmXlsxImport("merge")}
          onConfirmReplace={() => confirmXlsxImport("replace")}
          onCancel={() => setXlsxParseResult(null)}
          loading={xlsxApplying}
        />
      )}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title || "Confirmar acción"}
        message={confirm?.message}
        variant={confirm?.variant || "default"}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={confirm?.cancelLabel}
        onConfirm={() => { const cb = confirm?.onConfirm; if (cb) cb(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ── REPORTE MENSUAL EJECUTIVO COMPONENT ─────────────────────────
export default memo(ModuloConfiguracion);
