import { memo, useEffect, useState } from "react";
import { Check, Copy, Download, Settings2, Shield, Trash2, Users } from "lucide-react";
import { getUserWorkspace, getWorkspaceMembers, type Workspace, type WorkspaceMember } from "../backend/supabaseWorkspace";
import { SUPABASE_CONFIGURED } from "../backend/supabaseClient";
import { WorkspaceSetup } from "../components/ui/WorkspaceSetup";
import { UserManager } from "../components/ui/UserManager";
import { getSession } from "../auth/authService";
import type { AppData } from "../domain/types";
import { ConfirmDialog, ExpandableSection, ModuleHeader } from "../components/ui";
import type { ConfirmState } from "../shared/formTypes";
import { getAuditLog, clearAuditLog } from "../audit/auditService";
import type { AuditEntry } from "../audit/auditTypes";

function ModuloAdmin({
  data,
  encryptionEnabled, openEncryptionSetup, disableEncryption,
  restaurarEjemplos, limpiarTodo,
}: {
  data: AppData;
  encryptionEnabled: boolean;
  openEncryptionSetup: () => void;
  disableEncryption: () => void;
  restaurarEjemplos: () => void;
  limpiarTodo: () => void;
}) {
  const session = getSession();
  const isAdmin = session?.role === "admin";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showJoinSetup, setShowJoinSetup] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>("all");

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    getUserWorkspace().then(r => { if (r.ok && r.data) setWorkspace(r.data); });
    getWorkspaceMembers().then(r => { if (r.ok) setMembers(r.data); });
  }, []);

  useEffect(() => {
    setAuditLog(getAuditLog().reverse());
  }, []);

  const handleCopyCode = () => {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.invite_code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const counts: Record<string, number> = {
    cursos: data.cursos.length,
    ocs: data.ocs.length,
    practicantes: data.practicantes.length,
    presupuesto: data.presupuesto.length,
    procesos: data.procesos.length,
    diplomas: data.diplomas.length,
    evaluacionesPsicolaborales: data.evaluacionesPsicolaborales.length,
    cargaSemanal: data.cargaSemanal.length,
    contactos: data.contactos.length,
  };

  return (
    <div className="space-y-4">
      <ModuleHeader
        icon={<Settings2 size={20} className="text-white" />}
        gradient="from-slate-600 to-slate-800"
        title="Administración"
        subtitle="Usuarios, equipo, seguridad y configuración avanzada del sistema."
      />

      {/* Trabajo en equipo */}
      {SUPABASE_CONFIGURED && (
        <ExpandableSection title="Trabajo en equipo" defaultOpen={true}>
          {workspace ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-48 space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Equipo actual</p>
                  <p className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    {workspace.name}
                  </p>
                </div>

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
                <button onClick={() => setShowJoinSetup(true)} className="text-xs text-blue-600 hover:underline">
                  Unirme a otro equipo con un código
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-2">Cargando información del equipo…</div>
          )}

          {showJoinSetup && (
            <WorkspaceSetup onReady={ws => { setWorkspace(ws); setShowJoinSetup(false); }} />
          )}
        </ExpandableSection>
      )}

      {/* Gestión de usuarios (solo admin) */}
      {SUPABASE_CONFIGURED && isAdmin && (
        <ExpandableSection title="Gestión de usuarios" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Administra quién puede acceder a la aplicación. Los cambios aplican en todos los dispositivos de inmediato.
            </p>
            <UserManager currentUsername={session?.username ?? ""} />
          </div>
        </ExpandableSection>
      )}

      {/* Sistema y seguridad */}
      <ExpandableSection title="Sistema y seguridad" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cifrado */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Shield size={12} />
              Cifrado local
            </p>
            <p className="text-sm text-slate-600">Protege datos sensibles en este navegador con una clave local.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Estado:</span>
              <span className={`text-xs font-semibold ${encryptionEnabled ? "text-emerald-600" : "text-slate-500"}`}>
                {encryptionEnabled ? "Activo" : "Desactivado"}
              </span>
            </div>
            {!encryptionEnabled
              ? <button onClick={openEncryptionSetup} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">Activar cifrado</button>
              : <button onClick={disableEncryption} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition">Desactivar cifrado</button>
            }
            <p className="text-[11px] text-slate-400">La clave se solicita al iniciar y no se guarda en localStorage.</p>
          </div>

          {/* Registros por módulo */}
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

          {/* Zona de peligro (solo admin) */}
          {isAdmin && (
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-red-500 uppercase tracking-wide">Zona de peligro</p>
              <p className="text-sm text-slate-600">Restaura datos de ejemplo o elimina todo permanentemente.</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setConfirm({
                    title: "Restaurar ejemplos",
                    message: "¿Restaurar datos de ejemplo? Se sobreescribirán los datos actuales.",
                    variant: "warning",
                    confirmLabel: "Restaurar",
                    onConfirm: () => { restaurarEjemplos(); setConfirm(null); },
                  })}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition"
                >
                  Restaurar ejemplos
                </button>
                <button
                  onClick={() => setConfirm({
                    title: "Limpiar todos los datos",
                    message: "¿Seguro? Esta acción eliminará todos los registros permanentemente.",
                    variant: "danger",
                    confirmLabel: "Limpiar todo",
                    onConfirm: () => { limpiarTodo(); setConfirm(null); },
                  })}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 transition"
                >
                  Limpiar todos los datos
                </button>
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Logs de auditoría */}
      {isAdmin && (
        <ExpandableSection title="Logs de auditoría" defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white"
              >
                <option value="all">Todas las acciones</option>
                <option value="login">Sesiones</option>
                <option value="record">Registros</option>
                <option value="data">Datos</option>
                <option value="backup">Respaldos</option>
              </select>
              <span className="text-xs text-slate-400 flex-1">{auditLog.length} entradas guardadas</span>
              <button
                onClick={() => {
                  const csv = ["timestamp,usuario,accion,modulo,detalle",
                    ...auditLog.map(e => `"${e.timestamp}","${e.username}","${e.action}","${e.module ?? ""}","${e.detail ?? ""}"`),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
              >
                <Download size={12} />Exportar CSV
              </button>
              <button
                onClick={() => setConfirm({
                  title: "Limpiar logs de auditoría",
                  message: "¿Eliminar todos los registros de auditoría? Esta acción no se puede deshacer.",
                  variant: "danger",
                  confirmLabel: "Limpiar",
                  onConfirm: () => { clearAuditLog(); setAuditLog([]); setConfirm(null); },
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition border border-red-100"
              >
                <Trash2 size={12} />Limpiar
              </button>
            </div>

            {auditLog.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin registros de auditoría aún.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-slate-500 font-medium">
                      <th className="px-3 py-2 whitespace-nowrap">Fecha y hora</th>
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Acción</th>
                      <th className="px-3 py-2">Módulo</th>
                      <th className="px-3 py-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog
                      .filter(e => auditFilter === "all" || e.action.startsWith(auditFilter))
                      .slice(0, 200)
                      .map(e => (
                        <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-1.5 whitespace-nowrap text-slate-500">
                            {new Date(e.timestamp).toLocaleString("es-CL")}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-slate-700">{e.username}</td>
                          <td className="px-3 py-1.5">
                            <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide ${
                              e.action.startsWith("login")    ? "bg-blue-50 text-blue-700" :
                              e.action.startsWith("record")  ? "bg-indigo-50 text-indigo-700" :
                              e.action.startsWith("data")    ? "bg-amber-50 text-amber-700" :
                              e.action.startsWith("backup")  ? "bg-emerald-50 text-emerald-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>{e.action}</span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-500 capitalize">{e.module ?? "—"}</td>
                          <td className="px-3 py-1.5 text-slate-500 max-w-xs truncate">{e.detail ?? "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ExpandableSection>
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title || "Confirmar"}
        message={confirm?.message}
        variant={confirm?.variant || "default"}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => { const cb = confirm?.onConfirm; if (cb) cb(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

export default memo(ModuloAdmin);
