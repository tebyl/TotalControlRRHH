import { semaforo } from "../utils/appHelpers";

export const prioridadColor: Record<string, string> = {
  "P1 Crítico": "bg-red-100 text-red-800 border border-red-200",
  "P2 Alto": "bg-orange-100 text-orange-800 border border-orange-200",
  "P3 Medio": "bg-amber-50 text-amber-800 border border-amber-200",
  "P4 Bajo": "bg-green-100 text-green-800 border border-green-200",
};

export const estadoColor: Record<string, string> = {
  "Pendiente revisar": "bg-slate-100 text-slate-700 border border-slate-200",
  "En cotización": "bg-sky-50 text-sky-700 border border-sky-200",
  "En aprobación": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Programado: "bg-blue-50 text-blue-700 border border-blue-200",
  Ejecutado: "bg-teal-50 text-teal-700 border border-teal-200",
  Cerrado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Detenido: "bg-stone-100 text-stone-700 border border-stone-200",
  "Pendiente crear": "bg-slate-100 text-slate-700 border border-slate-200",
  Solicitada: "bg-sky-50 text-sky-700 border border-sky-200",
  Emitida: "bg-teal-50 text-teal-700 border border-teal-200",
  "Enviada proveedor": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Cerrada: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Por buscar": "bg-slate-100 text-slate-700 border border-slate-200",
  "En reclutamiento": "bg-sky-50 text-sky-700 border border-sky-200",
  Seleccionado: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Activo: "bg-teal-50 text-teal-700 border border-teal-200",
  Finalizado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Pedir a la OTEC": "bg-amber-50 text-amber-800 border border-amber-200",
  "Enviar o pedir al participante": "bg-orange-50 text-orange-700 border border-orange-200",
  "Subir a BUK": "bg-red-100 text-red-800 border border-red-200",
  Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Pendiente subir": "bg-red-100 text-red-800 border border-red-200",
  Subido: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Rechazado: "bg-red-50 text-red-700 border border-red-200",
  "No aplica": "bg-slate-100 text-slate-600 border border-slate-200",
  "Pendiente solicitar": "bg-slate-100 text-slate-700 border border-slate-200",
  Agendada: "bg-sky-50 text-sky-700 border border-sky-200",
  Realizada: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Informe recibido": "bg-teal-50 text-teal-700 border border-teal-200",
  "En revisión": "bg-orange-50 text-orange-700 border border-orange-200",
  Recomendado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Recomendado con observaciones": "bg-amber-50 text-amber-800 border border-amber-200",
  "No recomendado": "bg-red-50 text-red-700 border border-red-200",
  "Pendiente entregar": "bg-slate-100 text-slate-700 border border-slate-200",
  Entregado: "bg-blue-50 text-blue-700 border border-blue-200",
  "En descuento": "bg-orange-100 text-orange-800 border border-orange-200",
};

export function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide ${colorClass || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
      {label}
    </span>
  );
}

export function SemaforoBadge({ fecha }: { fecha: string }) {
  const s = semaforo(fecha);
  const softBg: Record<string, string> = {
    "#DC2626": "bg-red-100 text-red-800 border-red-200",
    "#EA580C": "bg-orange-100 text-orange-800 border-orange-200",
    "#F59E0B": "bg-amber-50 text-amber-800 border-amber-200",
    "#FBBF24": "bg-yellow-50 text-yellow-800 border-yellow-200",
    "#16A34A": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "#9CA3AF": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide border ${softBg[s.color] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}
