import React, { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import type { UserRole } from "../../auth/authTypes";
import {
  createRemoteUser, deleteRemoteUser, listRemoteUsers,
  updateRemoteUser, type RemoteUser,
} from "../../backend/supabaseUsers";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin",   label: "Admin — acceso total" },
  { value: "rrhh",    label: "RRHH — editar todo" },
  { value: "lectura", label: "Lectura — solo ver" },
];

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function UserManager({ currentUsername }: { currentUsername: string }) {
  const [users, setUsers] = useState<RemoteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("rrhh");
  const [newDisplay, setNewDisplay] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    listRemoteUsers()
      .then(r => { if (r.ok) setUsers(r.data); else setError(r.error); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newDisplay.trim()) {
      setFormError("Completa todos los campos");
      return;
    }
    setSaving(true);
    setFormError("");
    const hash = await sha256hex(newPassword);
    const result = await createRemoteUser(newUsername.trim(), hash, newRole, newDisplay.trim());
    setSaving(false);
    if (!result.ok) { setFormError(result.error); return; }
    setNewUsername(""); setNewPassword(""); setNewDisplay(""); setNewRole("rrhh");
    setShowForm(false);
    load();
  };

  const handleToggleActive = async (user: RemoteUser) => {
    await updateRemoteUser(user.id, { active: !user.active });
    load();
  };

  const handleDelete = async (user: RemoteUser) => {
    if (!confirm(`¿Eliminar permanentemente al usuario "${user.username}"?`)) return;
    await deleteRemoteUser(user.id);
    load();
  };

  const handleResetPassword = async (user: RemoteUser) => {
    const newPass = prompt(`Nueva contraseña para ${user.username}:`);
    if (!newPass) return;
    const hash = await sha256hex(newPass);
    const result = await updateRemoteUser(user.id, { password_hash: hash });
    if (!result.ok) alert("Error: " + result.error);
    else alert("Contraseña actualizada correctamente");
  };

  if (loading) return <div className="text-sm text-slate-400 py-2">Cargando usuarios…</div>;
  if (error)   return <div className="text-sm text-red-500 py-2">{error}</div>;

  return (
    <div className="space-y-4">
      {/* Tabla de usuarios */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-2.5">Usuario</th>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Rol</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={`border-t border-slate-100 ${!u.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 font-mono text-slate-800 font-medium">{u.username}</td>
                <td className="px-4 py-2.5 text-slate-700">{u.display_name}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    u.role === "admin"   ? "bg-red-100 text-red-700" :
                    u.role === "rrhh"    ? "bg-blue-100 text-blue-700" :
                                           "bg-slate-100 text-slate-600"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${u.active ? "text-emerald-600" : "text-slate-400"}`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    {u.username !== currentUsername && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="px-2 py-1 text-xs font-medium rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                    >
                      Cambiar clave
                    </button>
                    {u.username !== currentUsername && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1 text-xs rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">No hay usuarios en Supabase aún</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón agregar */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={15} />
          Agregar usuario
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Nuevo usuario</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Usuario (login)</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ej: MariaSilva" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre visible</label>
              <input value={newDisplay} onChange={e => setNewDisplay(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ej: María Silva" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña inicial</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rol</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-red-600 text-xs">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
