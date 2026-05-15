import React, { useState } from "react";
import type { Workspace } from "../../backend/supabaseWorkspace";
import { createWorkspace, joinWorkspace } from "../../backend/supabaseWorkspace";

type Props = {
  onReady: (ws: Workspace) => void;
};

export function WorkspaceSetup({ onReady }: Props) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("Mi equipo");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createWorkspace(name.trim() || "Mi equipo");
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👥</div>
          <h2 className="text-2xl font-bold text-gray-900">Trabajo en equipo</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Crea un espacio de trabajo o únete al de tu equipo
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center gap-4 p-4 border-2 border-blue-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
            >
              <span className="text-2xl">✨</span>
              <div>
                <div className="font-semibold text-gray-900">Crear nuevo equipo</div>
                <div className="text-sm text-gray-500">Soy el primero en usar esto</div>
              </div>
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center gap-4 p-4 border-2 border-green-100 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-left"
            >
              <span className="text-2xl">🔗</span>
              <div>
                <div className="font-semibold text-gray-900">Unirme a un equipo</div>
                <div className="text-sm text-gray-500">Tengo un código de invitación</div>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del equipo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: RRHH Planta Sur"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Creando..." : "Crear equipo"}
              </button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de invitación
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-lg tracking-widest text-center uppercase"
                placeholder="XXXXXXXX"
                maxLength={8}
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Uniéndome..." : "Unirme"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
