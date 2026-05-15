import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { ToastType, ToastItem } from "./shared/formTypes";
import { getResponsableName } from "./shared/dataHelpers";
import { FormCursos } from "./forms/FormCursos";
import { FormOCs } from "./forms/FormOCs";
import { FormPracticantes } from "./forms/FormPracticantes";
import { FormPresupuesto } from "./forms/FormPresupuesto";
import { FormProcesos } from "./forms/FormProcesos";
import { FormDiplomas } from "./forms/FormDiplomas";
import { FormEvaluaciones } from "./forms/FormEvaluaciones";
import { FormCargaSemanal } from "./forms/FormCargaSemanal";
import { FormContactos } from "./forms/FormContactos";
import { FormCapturaRapida } from "./forms/FormCapturaRapida";
import { FormValesGas } from "./forms/FormValesGas";
import { FormValeGasOrg } from "./forms/FormValeGasOrg";
import { FormReclutamiento } from "./forms/FormReclutamiento";
// Heavy modules — lazy + memo'd, only the active one is initialized
const ModuloContactos = lazy(() => import("./modules/ModuloContactos"));
const ModuloCursos = lazy(() => import("./modules/ModuloCursos"));
const ModuloDashboard = lazy(() => import("./modules/ModuloDashboard"));
const ModuloDiplomas = lazy(() => import("./modules/ModuloDiplomas"));
const ModuloEvaluaciones = lazy(() => import("./modules/ModuloEvaluaciones"));
const ModuloMiDia = lazy(() => import("./modules/ModuloMiDia"));
const ModuloOCs = lazy(() => import("./modules/ModuloOCs"));
const ModuloPracticantes = lazy(() => import("./modules/ModuloPracticantes"));
const ModuloProcesos = lazy(() => import("./modules/ModuloProcesos"));
const ModuloReclutamiento = lazy(() => import("./modules/ModuloReclutamiento"));
const ModuloPresupuesto = lazy(() => import("./modules/ModuloPresupuesto"));
const ModuloConfiguracion = lazy(() => import("./modules/ModuloConfiguracion"));
const ModuloValesGas = lazy(() => import("./modules/ModuloValesGas"));
const ModuloCargaSemanal = lazy(() => import("./modules/ModuloCargaSemanal"));
const ModuloReporteMensual = lazy(() => import("./modules/ModuloReporteMensual"));
import { hydrateData, useAppData } from "./state/useAppData";
import { useModals } from "./state/useModals";
import { useBackups } from "./state/useBackups";
import { useExportImport } from "./importExport/useExportImport";
import { AppLayout } from "./layout/AppLayout";
import { createDataToSave } from "./utils/appHelpers";
import type { ModuloKey } from "./domain/types";
import { saveAppData, writeStorageJSON, STORAGE_KEY } from "./storage/localStorage";
import {
  cachePassphrase,
  clearCachedPassphrase,
  decryptAppData,
  encryptAppData,
} from "./storage/encryption";
import { Modal, SkeletonCard, SkeletonTable } from "./components/ui";
import { login as authLogin, getSession, logout as authLogout, refreshSession } from "./auth/authService";
import { can } from "./auth/permissions";
import { logAudit } from "./audit/auditService";
import ModuloInicio from "./modules/ModuloInicio";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { useNotifications } from "./hooks/useNotifications";
import { useBroadcastSync } from "./hooks/useBroadcastSync";

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

// COMPONENTS
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────

function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const session = await authLogin(user.trim(), pass);
    setLoading(false);
    if (session) {
      logAudit("login", { detail: `Usuario ${session.username} inició sesión` });
      onLogin();
    } else {
      setError("Usuario o clave incorrectos");
      setPass("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Control Operativo</h1>
          <p className="text-slate-500 text-sm mt-1">Ingreso autorizado</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Usuario</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre de usuario" autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clave</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">{showPass ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60">{loading ? "Verificando…" : "Ingresar"}</button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">Acceso local básico. Para seguridad real se requiere backend.</p>
      </div>
    </div>
  );
}

function EncryptionUnlock({
  passphrase,
  setPassphrase,
  error,
  onUnlock,
}: {
  passphrase: string;
  setPassphrase: (value: string) => void;
  error: string;
  onUnlock: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Datos protegidos</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa la clave local para desbloquear la información.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clave de cifrado</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={onUnlock} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">Desbloquear</button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">La clave no se guarda en el navegador; se conserva solo durante esta sesión.</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────

type Modulo = ModuloKey;

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => getSession() !== null);
  const {
    data,
    setData,
    dataReady,
    setDataReady,
    encryptionEnabled,
    setEncryptionEnabled,
    encryptedPayload,
    setEncryptedPayload,
    unlockOpen,
    setUnlockOpen,
    unlockPassphrase,
    setUnlockPassphrase,
    unlockError,
    setUnlockError,
  } = useAppData();
  const [encryptionSetupOpen, setEncryptionSetupOpen] = useState(false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState("");
  const [encryptionPassphraseConfirm, setEncryptionPassphraseConfirm] = useState("");
  const [encryptionSetupError, setEncryptionSetupError] = useState("");
  const [activeModulo, setActiveModulo] = useState<Modulo>("inicio");
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("kata_focus_mode") === "true");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleFocusMode = () => { const v = !focusMode; setFocusMode(v); localStorage.setItem("kata_focus_mode", String(v)); };

  // Role derived from session — cheap sessionStorage read, no memoization needed
  const currentRole = authenticated ? getSession()?.role : undefined;

  // Session expiry check — every 60 s, only while authenticated
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      if (getSession() === null) {
        logAudit("logout", { detail: "Sesión expirada automáticamente" });
        authLogout();
        setAuthenticated(false);
        toastShow("Sesión expirada", { type: "warning", message: "Por seguridad, inicia sesión nuevamente." });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // Refresh session on user interaction (throttled to once per minute)
  useEffect(() => {
    if (!authenticated) return;
    let lastRefresh = 0;
    const handler = () => {
      const now = Date.now();
      if (now - lastRefresh > 60_000) { refreshSession(); lastRefresh = now; }
    };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, [authenticated]);

  useEffect(() => {
    if (!dataReady) return;
    setTableLoading(true);
    const timer = setTimeout(() => setTableLoading(false), 200);
    return () => clearTimeout(timer);
  }, [activeModulo, search, dataReady]);

  const toastShow = (
    title: string,
    options?: {
      type?: ToastType;
      message?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }
  ) => {
    const { type = "info", message, action, duration = 2500 } = options || {};
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => {
      if (prev.some(t => t.title === title && t.message === message)) return prev;
      return [...prev, { id, type, title, message, action }];
    });
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const { backups, setBackups, runBackupAndToast } = useBackups({ data, setData, toastShow });
  const {
    modalOpen,
    modalModulo,
    editItem,
    confirm,
    setConfirm,
    captureOpen,
    setCaptureOpen,
    openNew,
    openEdit,
    closeModal,
    openCapture,
    saveItem,
    deleteItem,
    duplicateItem,
    markClosed,
    saveCaptura,
  } = useModals({ data, setData, setActiveModulo, runBackupAndToast, toastShow });
  const {
    exporting,
    lastJSONExport,
    lastXLSXExport,
    canExportFull,
    canExportSummary,
    canExportAnonymized,
    exportJSON,
    exportJSONSummary,
    exportJSONAnonymized,
    importJSON,
    exportXLSX,
    exportXLSXAnonymized,
    exportLimpia,
    downloadXlsxTemplate,
    parseXlsxFile,
    restaurarEjemplos,
    limpiarTodo,
  } = useExportImport({ data, setData, setConfirm, runBackupAndToast, toastShow, currentRole });

  const { canInstall, install, dismiss } = useInstallPrompt();
  useNotifications(data, authenticated);
  useBroadcastSync(data, setData, authenticated);

  const openEncryptionSetup = () => {
    setEncryptionSetupError("");
    setEncryptionPassphrase("");
    setEncryptionPassphraseConfirm("");
    setEncryptionSetupOpen(true);
  };

  const handleEnableEncryption = async () => {
    const passphrase = encryptionPassphrase.trim();
    if (passphrase.length < 8) { setEncryptionSetupError("La clave debe tener al menos 8 caracteres."); return; }
    if (passphrase !== encryptionPassphraseConfirm.trim()) { setEncryptionSetupError("Las claves no coinciden."); return; }
    try {
      cachePassphrase(passphrase);
      const encrypted = await encryptAppData(createDataToSave(data), passphrase);
      writeStorageJSON(STORAGE_KEY, encrypted);
      setEncryptionEnabled(true);
      setEncryptedPayload(encrypted);
      setEncryptionSetupOpen(false);
      toastShow("Cifrado local activado", { type: "success" });
    } catch {
      setEncryptionSetupError("No se pudo activar el cifrado.");
    }
  };

  const handleDisableEncryption = () => {
    setConfirm({
      title: "Desactivar cifrado local",
      message: "Los datos quedarán en texto plano en este navegador.",
      variant: "warning",
      confirmLabel: "Desactivar",
      onConfirm: () => {
        clearCachedPassphrase();
        setEncryptionEnabled(false);
        setEncryptedPayload(null);
        setUnlockOpen(false);
        setUnlockError("");
        setUnlockPassphrase("");
        saveAppData(STORAGE_KEY, data);
        toastShow("Cifrado local desactivado", { type: "info" });
        setConfirm(null);
      },
    });
  };

  const handleUnlock = async () => {
    if (!encryptedPayload) return;
    const passphrase = unlockPassphrase.trim();
    if (!passphrase) { setUnlockError("Ingresa la clave de cifrado."); return; }
    try {
      const decrypted = await decryptAppData(encryptedPayload, passphrase);
      setData(hydrateData(decrypted));
      setDataReady(true);
      cachePassphrase(passphrase);
      setUnlockPassphrase("");
      setUnlockError("");
      setUnlockOpen(false);
    } catch {
      setUnlockError("Clave incorrecta. Intenta nuevamente.");
    }
  };

  // ── PERMISSIONS & LOGOUT ────────────────────
  const logout = useCallback(() => { logAudit("logout", { detail: "Cierre de sesión manual" }); authLogout(); setAuthenticated(false); toastShow("Sesión cerrada", { type: "info" }); }, []);
  const permDeleteItem = can(currentRole, "record:delete") ? deleteItem : undefined;
  const permDuplicateItem = can(currentRole, "record:duplicate") ? duplicateItem : undefined;
  const permMarkClosed = can(currentRole, "record:close") ? markClosed : undefined;

  // Stable callbacks — prevent unnecessary re-renders of memoized child modules
  const stableOpenNew = useCallback(openNew, []);
  const stableOpenEdit = useCallback(openEdit, []);
  const stableSetSearch = useCallback((v: string) => setSearch(v), []);
  const stableOpenCapture = useCallback(openCapture, []);

    // ── MODULES RENDER ────────────────────────

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;
  if (unlockOpen) {
    return (
      <EncryptionUnlock
        passphrase={unlockPassphrase}
        setPassphrase={setUnlockPassphrase}
        error={unlockError}
        onUnlock={handleUnlock}
      />
    );
  }
  if (!dataReady) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  // ── INSTRUCTIONS MODAL ────────────────────

  const instructionsContent = `
# Guía rápida de uso del Control Operativo

## 1. Regla de oro
"Si no está registrado aquí, no existe para seguimiento."

## 2. Rutina semanal recomendada
- **Lunes:** Revisar cursos, OCs y presupuesto.
- **Miércoles:** Revisar diplomas/certificados/licencias, BUK y evaluaciones psicolaborales.
- **Viernes:** Cerrar pendientes, actualizar estados y preparar la semana siguiente.

## 3. Cómo usar el Dashboard
El dashboard responde:
- Qué está crítico (P1)
- Qué está vencido o por vencer
- Qué está bloqueado
- Qué debo hacer primero hoy
- Qué está pendiente de BUK
- Qué evaluaciones están pendientes o bloqueadas

## 4. Cómo registrar un curso
- Ir a Control Cursos
- Crear nuevo registro
- Definir origen, estado, prioridad, responsable y próxima acción
- Si requiere OC, asociar OC
- Actualizar hasta cerrar

## 5. Cómo controlar OCs
- Crear OC
- Asociarla a curso o servicio
- Definir estado y fecha límite
- Revisar bloqueos

## 6. Cómo controlar diplomas/certificados/licencias
- Crear registro asociado al curso
- Seguir etapas: Pedir a la OTEC → Enviar al participante → Subir a BUK → Completado
- Revisar pendientes de BUK en Dashboard

## 7. Cómo controlar evaluaciones psicolaborales
- Crear evaluación por mes, cargo y candidato
- Registrar proveedor/psicólogo
- Definir fecha de evaluación y fecha entrega informe
- Actualizar resultado
- Cerrar cuando esté revisada

## 8. Cómo usar responsables/contactos
- Todo responsable debe existir en Contactos
- Crear contacto antes de asignarlo
- Usar solo contactos activos
- Mantener correos y roles actualizados

## 9. Cómo respaldar información
- Exportar JSON semanalmente
- Exportar XLSX para reportes
- Importar JSON solo si se confía en el archivo
- Guardar respaldo con fecha

## 10. Buenas prácticas
- No dejar fecha próxima acción vacía en temas críticos
- Actualizar estados el mismo día
- Cerrar lo finalizado
- Usar observaciones para contexto breve
- Revisar bloqueos antes de pedir ayuda
  `.trim();

  const copyInstructions = () => { navigator.clipboard.writeText(instructionsContent); toastShow("Instrucciones copiadas", { type: "success" }); };
  const downloadInstructions = () => {
    const blob = new Blob([instructionsContent], { type: "text/plain" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "instrucciones_kata_v5.txt";
    a.click();
    URL.revokeObjectURL(url);
    toastShow("Instrucciones descargadas", { type: "success" });
  };

  // ── MAIN RENDER ────────────────────────────

  return (
    <>
    {canInstall && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 text-sm text-slate-700 max-w-sm w-full mx-4">
        <span className="text-lg shrink-0">📲</span>
        <span className="flex-1 font-medium">Instalar Control RH en este dispositivo</span>
        <button onClick={install} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0">Instalar</button>
        <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 text-lg leading-none">&times;</button>
      </div>
    )}
    <AppLayout
      activeModulo={activeModulo}
      focusMode={focusMode}
      version={data.meta.version}
      confirm={confirm}
      toasts={toasts}
      onModuloChange={setActiveModulo}
      onFocusModeChange={toggleFocusMode}
      onQuickCapture={openCapture}
      onLogout={logout}
      onConfirmCancel={() => setConfirm(null)}
      onRemoveToast={removeToast}
    >
        <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Cargando módulo…</div>}>
        {activeModulo === "inicio" && (
          <ModuloInicio
            data={data}
            setActiveModulo={setActiveModulo}
            openNew={stableOpenNew}
            openCapture={stableOpenCapture}
            exportXLSX={exportXLSX}
            exportXLSXAnonymized={exportXLSXAnonymized}
            canExportFull={canExportFull}
            canExportAnonymized={canExportAnonymized}
          />
        )}
        {activeModulo === "midia" && <ModuloMiDia data={data} setActiveModulo={setActiveModulo} onCapturaRapida={stableOpenCapture} />}
        {activeModulo === "dashboard" && (
          <ModuloDashboard
            data={data}
            reporteMensual={<ModuloReporteMensual data={data} toastShow={toastShow} />}
            setActiveModulo={setActiveModulo}
          />
        )}
        {activeModulo === "cursos" && <ModuloCursos data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "ocs" && <ModuloOCs data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "practicantes" && <ModuloPracticantes data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "presupuesto" && <ModuloPresupuesto data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "procesos" && <ModuloProcesos data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "diplomas" && <ModuloDiplomas data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "evaluaciones" && <ModuloEvaluaciones data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "cargaSemanal" && <ModuloCargaSemanal data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} tableLoading={tableLoading} />}
        {activeModulo === "contactos" && <ModuloContactos data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} tableLoading={tableLoading} />}
        {activeModulo === "valesGas" && <ModuloValesGas data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "reclutamiento" && <ModuloReclutamiento data={data} search={search} setSearch={stableSetSearch} openNew={stableOpenNew} openEdit={stableOpenEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "configuracion" && (
          <ModuloConfiguracion
            data={data}
            exportJSON={exportJSON}
            exportJSONSummary={exportJSONSummary}
            exportJSONAnonymized={exportJSONAnonymized}
            importJSON={importJSON}
            exportXLSX={exportXLSX}
            exportXLSXAnonymized={exportXLSXAnonymized}
            exportLimpia={exportLimpia}
            restaurarEjemplos={restaurarEjemplos}
            limpiarTodo={limpiarTodo}
            showInstructions={() => setShowInstructions(true)}
            backups={backups}
            setBackups={setBackups}
            lastJSONExport={lastJSONExport}
            lastXLSXExport={lastXLSXExport}
            runBackupAndToast={runBackupAndToast}
            setData={setData}
            toastShow={toastShow}
            downloadXlsxTemplate={downloadXlsxTemplate}
            parseXlsxFile={parseXlsxFile}
            canExportFull={canExportFull}
            canExportSummary={canExportSummary}
            canExportAnonymized={canExportAnonymized}
            encryptionEnabled={encryptionEnabled}
            openEncryptionSetup={openEncryptionSetup}
            disableEncryption={handleDisableEncryption}
            exporting={exporting}
          />
        )}
        </Suspense>

        {/* Modals */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editItem ? "Editar registro" : "Nuevo registro"}
          size={modalModulo === "cursos" || modalModulo === "diplomas" || modalModulo === "evaluaciones" ? "xl" : "lg"}
        >
          {modalModulo === "cursos" && <FormCursos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "ocs" && <FormOCs data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "practicantes" && <FormPracticantes data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "presupuesto" && <FormPresupuesto data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "procesos" && <FormProcesos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "diplomas" && <FormDiplomas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "evaluaciones" && <FormEvaluaciones data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "cargaSemanal" && <FormCargaSemanal data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "contactos" && <FormContactos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "valesGas" && <FormValesGas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "valesGasOrganizacion" && <FormValeGasOrg data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "reclutamiento" && <FormReclutamiento data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
        </Modal>

        <Modal isOpen={encryptionSetupOpen} onClose={() => setEncryptionSetupOpen(false)} title="🔐 Activar cifrado local" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">La clave protege los datos sensibles en este navegador. No se puede recuperar si la olvidas.</p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva clave</label>
              <input
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar clave</label>
              <input
                type="password"
                value={encryptionPassphraseConfirm}
                onChange={(e) => setEncryptionPassphraseConfirm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la clave"
                autoComplete="new-password"
              />
            </div>
            {encryptionSetupError && <p className="text-red-600 text-sm">{encryptionSetupError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEncryptionSetupOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">Cancelar</button>
              <button onClick={handleEnableEncryption} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Activar cifrado</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showInstructions} onClose={() => setShowInstructions(false)} title="📖 Instrucciones de uso" size="xl">
          <div className="space-y-3">
            {[
              { title: "1. Regla de oro", body: "Si no está registrado aquí, no existe para seguimiento." },
              { title: "2. Rutina semanal", body: "Lunes: cursos, OCs, presupuesto · Miércoles: diplomas, BUK, evaluaciones · Viernes: cerrar pendientes y preparar próxima semana." },
              { title: "3. Dashboard y Mi Día", body: "El Dashboard muestra qué está crítico, vencido, bloqueado y qué hacer primero. Usa también Mi Día para una vista simplificada." },
              { title: "4. Cómo registrar un curso", body: "Ve a Cursos / DNC → Agregar nuevo → Define origen, estado, prioridad, responsable y próxima acción. Si requiere OC, asóciala. Actualiza hasta cerrar." },
              { title: "5. Cómo controlar OCs", body: "Crea la OC en OCs Pendientes → Asóciala al curso → Define estado y fecha límite → Revisa bloqueos periódicamente." },
              { title: "6. Diplomas, certificados y licencias", body: "Crea el registro asociado al curso → Sigue las etapas: Pedir a la OTEC → Enviar al participante → Subir a BUK → Completado." },
              { title: "7. Evaluaciones psicolaborales", body: "Crea evaluación por mes, cargo y candidato → Registra proveedor → Define fecha de evaluación e informe → Actualiza resultado y cierra." },
              { title: "8. Responsables y contactos", body: "Todo responsable debe existir primero en Contactos. Créalo antes de asignarlo. Usa solo contactos activos." },
              { title: "9. Cómo respaldar", body: "Exporta JSON semanalmente desde Configuración. Guarda el archivo en la carpeta /backups del proyecto. También puedes exportar XLSX para reportes." },
              { title: "10. Buenas prácticas", body: "No dejes fechas vacías en temas críticos. Actualiza estados el mismo día. Cierra lo finalizado. Usa observaciones breves. Revisa bloqueos antes de pedir ayuda." },
            ].map((step, idx) => (
              <details key={idx} className="bg-slate-50 rounded-xl border border-[#D9E2EC]">
                <summary className="px-5 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">{step.title}</summary>
                <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </details>
            ))}
          </div>
          <div className="flex gap-3 mt-6"><button onClick={copyInstructions} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">📋 Copiar todo</button><button onClick={downloadInstructions} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">📥 Descargar .txt</button></div>
        </Modal>

        {/* CAPTURA RÁPIDA: Modal global */}
        <Modal isOpen={captureOpen} onClose={() => setCaptureOpen(false)} title="⚡ Captura rápida" size="md">
          <FormCapturaRapida data={data} onCancel={() => setCaptureOpen(false)} onSave={saveCaptura} />
        </Modal>


    </AppLayout>
    </>
  );
}


