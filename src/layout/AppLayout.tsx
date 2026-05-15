import type { ReactNode } from "react";
import { Bell, CheckCircle2, CloudOff, Loader2, Search, Settings } from "lucide-react";
import type { ModuloKey } from "../domain/types";
import type { ConfirmState, ToastItem } from "../shared/formTypes";
import { Sidebar } from "../components/sidebar/Sidebar";
import { ConfirmDialog, ErrorBoundary, ToastContainer } from "../components/ui";
import { SUPABASE_CONFIGURED } from "../backend/supabaseClient";

type AppLayoutProps = {
  activeModulo: ModuloKey;
  focusMode: boolean;
  syncStatus?: "idle" | "saving" | "saved" | "error";
  version: string;
  confirm: ConfirmState | null;
  toasts: ToastItem[];
  onModuloChange: (modulo: ModuloKey) => void;
  onFocusModeChange: () => void;
  onQuickCapture: () => void;
  onLogout: () => void;
  onConfirmCancel: () => void;
  onRemoveToast: (id: string) => void;
  children: ReactNode;
};

const SIDEBAR_TO_MODULO: Record<string, ModuloKey> = {
  inicio: "inicio",
  midia: "midia",
  dashboard: "dashboard",
  cursos: "cursos",
  ocs: "ocs",
  practicantes: "practicantes",
  evaluaciones: "evaluaciones",
  reclutamiento: "reclutamiento",
  procesos: "procesos",
  diplomas: "diplomas",
  presupuesto: "presupuesto",
  valesGas: "valesGas",
  cargaSemanal: "cargaSemanal",
  contactos: "contactos",
  configuracion: "configuracion",
};

const MODULO_TO_SIDEBAR: Partial<Record<ModuloKey, string>> = {
  inicio: "inicio",
  midia: "midia",
  dashboard: "dashboard",
  cursos: "cursos",
  ocs: "ocs",
  practicantes: "practicantes",
  evaluaciones: "evaluaciones",
  reclutamiento: "reclutamiento",
  procesos: "procesos",
  diplomas: "diplomas",
  presupuesto: "presupuesto",
  valesGas: "valesGas",
  cargaSemanal: "cargaSemanal",
  contactos: "contactos",
  configuracion: "configuracion",
};

const MODULE_BREADCRUMB: Record<string, { group: string; label: string }> = {
  inicio: { group: "Inicio", label: "Resumen" },
  midia: { group: "Inicio", label: "Mi Día" },
  dashboard: { group: "Inicio", label: "Dashboard" },
  cursos: { group: "Operaciones", label: "Cursos / DNC" },
  ocs: { group: "Operaciones", label: "OCs" },
  procesos: { group: "Operaciones", label: "Procesos" },
  practicantes: { group: "Personas", label: "Practicantes" },
  evaluaciones: { group: "Personas", label: "Evaluaciones" },
  reclutamiento: { group: "Personas", label: "Reclutamiento" },
  contactos: { group: "Personas", label: "Contactos" },
  diplomas: { group: "Documentos", label: "Diplomas/Cert/Lic" },
  presupuesto: { group: "Finanzas", label: "Presupuesto" },
  valesGas: { group: "Finanzas", label: "Vales de Gas" },
  cargaSemanal: { group: "Finanzas", label: "Carga Semanal" },
  configuracion: { group: "Sistema", label: "Configuración" },
};

export function AppLayout({
  activeModulo,
  focusMode,
  version,
  confirm,
  toasts,
  onModuloChange,
  onFocusModeChange,
  onQuickCapture,
  onLogout,
  onConfirmCancel,
  onRemoveToast,
  syncStatus = "idle",
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeId={MODULO_TO_SIDEBAR[activeModulo] ?? activeModulo}
        onSelect={(id) => { const modulo = SIDEBAR_TO_MODULO[id]; if (modulo) onModuloChange(modulo); }}
        focusMode={focusMode}
        onFocusModeChange={onFocusModeChange}
        onQuickCapture={onQuickCapture}
        onLogout={onLogout}
        version={version}
      />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center gap-3 px-5 shrink-0">
          <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {MODULE_BREADCRUMB[activeModulo]?.group && (
              <>
                <span className="text-slate-400 truncate">{MODULE_BREADCRUMB[activeModulo].group}</span>
                <span className="text-slate-300">/</span>
              </>
            )}
            <span className="text-slate-700 font-medium truncate">{MODULE_BREADCRUMB[activeModulo]?.label ?? activeModulo}</span>
          </nav>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-56 cursor-default select-none">
            <Search size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 flex-1">Buscar en toda la app...</span>
            <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1 py-0.5 font-sans">⌘K</kbd>
          </div>
          {SUPABASE_CONFIGURED && (
            <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors" title={syncStatus === "saving" ? "Guardando..." : syncStatus === "saved" ? "Sincronizado" : syncStatus === "error" ? "Error al sincronizar" : ""}>
              {syncStatus === "saving" && <><Loader2 size={13} className="text-blue-500 animate-spin" /><span className="text-blue-500 hidden sm:inline">Guardando</span></>}
              {syncStatus === "saved"  && <><CheckCircle2 size={13} className="text-emerald-500" /><span className="text-emerald-500 hidden sm:inline">Sincronizado</span></>}
              {syncStatus === "error"  && <><CloudOff size={13} className="text-red-400" /><span className="text-red-400 hidden sm:inline">Sin sync</span></>}
            </div>
          )}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Notificaciones">
            <Bell size={15} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Configuración">
            <Settings size={15} />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${focusMode ? "p-4 max-w-4xl mx-auto" : "p-6"}`}>
          <ErrorBoundary>
            {children}
            <ConfirmDialog
              isOpen={!!confirm}
              title={confirm?.title || "Confirmar acción"}
              message={confirm?.message}
              variant={confirm?.variant || "default"}
              confirmLabel={confirm?.confirmLabel}
              cancelLabel={confirm?.cancelLabel}
              onConfirm={() => { const cb = confirm?.onConfirm; if (cb) cb(); }}
              onCancel={onConfirmCancel}
            />
            <div aria-live="polite">
              <ToastContainer
                toasts={toasts.map(({ id: _id, ...rest }) => rest)}
                onRemove={(index) => {
                  const target = toasts[index];
                  if (target) onRemoveToast(target.id);
                }}
              />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
