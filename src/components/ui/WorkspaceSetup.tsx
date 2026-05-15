import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Users, Zap } from "lucide-react";
import type { Workspace } from "../../backend/supabaseWorkspace";
import { createWorkspace, joinWorkspace } from "../../backend/supabaseWorkspace";

type Props = {
  onReady: (ws: Workspace) => void;
};

const FEATURES = [
  { icon: "🔄", text: "Sincronización en tiempo real entre todos los miembros" },
  { icon: "👥", text: "Varios usuarios editando a la vez sin conflictos" },
  { icon: "💾", text: "Datos guardados en la nube con respaldo automático" },
];

export function WorkspaceSetup({ onReady }: Props) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("Equipo RRHH");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createWorkspace(name.trim() || "Equipo RRHH");
    setLoading(false);
    if (result.ok) onReady(result.data);
    else setError(result.error);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await joinWorkspace(code);
    setLoading(false);
    if (result.ok) onReady(result.data);
    else setError(result.error);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bienvenido a PulsoLaboral</h2>
              <p className="text-blue-200 text-sm">Configura tu espacio de trabajo colaborativo</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-4">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-blue-100">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6">
          {mode === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">¿Cómo quieres comenzar?</p>
              <button
                onClick={() => setMode("create")}
                className="w-full flex items-center gap-4 p-4 border-2 border-blue-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors shrink-0">
                  <Zap size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Crear nuevo equipo</div>
                  <div className="text-sm text-slate-500">Soy el primero — configuro el espacio y luego invito al equipo</div>
                </div>
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center gap-4 p-4 border-2 border-emerald-100 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors shrink-0">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Unirme a un equipo existente</div>
                  <div className="text-sm text-slate-500">Tengo un código de invitación de mi administrador</div>
                </div>
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: RRHH Planta Sur"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Recibirás un código de 8 caracteres para compartir con tu equipo.
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm transition-colors"
              >
                {loading ? "Creando equipo…" : "Crear equipo →"}
              </button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Código de invitación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 font-mono text-xl tracking-[0.4em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Pídele el código a quien administra tu equipo en PulsoLaboral.
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-semibold text-sm transition-colors"
              >
                {loading ? "Verificando código…" : "Unirme al equipo →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
