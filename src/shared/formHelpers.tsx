/* eslint-disable react-refresh/only-export-components */
import { hoy } from "../utils/appHelpers";
import type { AppData } from "../domain/types";
import { INPUT_BASE } from "../components/forms/fields";
import type { VError } from "./formTypes";

export function validateGeneral(form: any, mainFieldKey: string, mainFieldLabel: string): { errors: VError; warnings: string[] } {
  const errors: VError = {};
  const warnings: string[] = [];
  const today = hoy();

  if (!form[mainFieldKey]?.toString().trim()) {
    errors[mainFieldKey] = `${mainFieldLabel} es obligatorio.`;
  }

  if (form.prioridad === "P1 Crítico") {
    if (!form.responsableId) errors.responsableId = "Prioridad P1 requiere un responsable.";
    if (form.proximaAccion !== undefined && !form.proximaAccion?.trim()) errors.proximaAccion = "Prioridad P1 requiere definir la próxima acción.";
    if (form.fechaProximaAccion !== undefined && !form.fechaProximaAccion) errors.fechaProximaAccion = "Prioridad P1 requiere una fecha para la próxima acción.";
  }

  const estado = form.estado || form.estadoOC || form.estadoActual || "";
  if (estado === "Detenido" || estado === "Detenida") {
    if (!form.bloqueadoPor || form.bloqueadoPor === "Sin bloqueo") errors.bloqueadoPor = "Un registro detenido debe indicar qué lo bloquea.";
    if (!form.observaciones?.trim()) errors.observaciones = "Agrega una observación breve explicando por qué está detenido.";
  }

  if (form.requiereOC === "Sí" && !form.numeroOC?.trim()) {
    warnings.push("Requiere OC pero no tiene N° OC asociada. Recuerda gestionarla.");
  }

  if (form.fechaProximaAccion && form.fechaProximaAccion < today) {
    warnings.push("La fecha próxima acción ya está vencida. Quedará marcada como vencida.");
  }

  const closedStates = ["Cerrado", "Cerrada", "Completado", "Finalizado"];
  if (closedStates.includes(estado) && form.bloqueadoPor && form.bloqueadoPor !== "Sin bloqueo") {
    warnings.push("Este registro está cerrado. Se recomienda dejar \"Bloqueado por\" como \"Sin bloqueo\".");
  }

  return { errors, warnings };
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isValidPhone = (value: string) => /^[0-9+()\s-]{6,}$/.test(value);
export const isValidRut = (value: string) => /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-?[0-9kK]$/.test(value);

export function notifyValidationError() {}

export function FormMessages({ errors, warnings }: { errors: VError; warnings: string[] }) {
  const errList = Object.values(errors);
  if (errList.length === 0 && warnings.length === 0) return null;
  return (
    <div className="md:col-span-2 space-y-2">
      {errList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-medium mb-1">No se puede guardar — revisa estos campos:</p>
          <ul className="list-disc list-inside space-y-0.5">{errList.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
        </div>
      )}
    </div>
  );
}

export function SelectContact({ value, onChange, data }: { value: string; onChange: (v: string) => void; data: AppData }) {
  const activeContacts = data.contactos.filter(c => c.activo === "Sí");
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={INPUT_BASE}>
      <option value="">Sin responsable</option>
      {activeContacts.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
    </select>
  );
}
