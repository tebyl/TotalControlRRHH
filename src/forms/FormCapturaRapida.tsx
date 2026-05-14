import { useState } from "react";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { notifyValidationError, SelectContact } from "../shared/formHelpers";
import { BLOQUEOS, PRIORIDADES, TIPOS_CAPTURA } from "../domain/options";
import type { AppData } from "../domain/types";

export function FormCapturaRapida({ data, onCancel, onSave }: { data: AppData; onCancel: () => void; onSave: (capture: any) => void }) {
  const [form, setForm] = useState({
    tipo: "Curso", nombre: "", prioridad: "P3 Medio", responsableId: "",
    proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setError("");
    if (!form.tipo) { setError("El tipo de registro es obligatorio."); notifyValidationError(); return; }
    if (!form.nombre.trim()) { setError("El nombre o asunto es obligatorio."); notifyValidationError(); return; }
    if (!form.prioridad) { setError("La prioridad es obligatoria."); notifyValidationError(); return; }
    if (!form.proximaAccion.trim()) { setError("La próxima acción es obligatoria."); notifyValidationError(); return; }
    if (form.prioridad === "P1 Crítico" && !form.fechaProximaAccion) { setError("Si la prioridad es P1 Crítico, la fecha próxima acción es obligatoria."); notifyValidationError(); return; }
    onSave({ ...form });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        Registra lo urgente ahora. Después puedes completar el detalle en el módulo correspondiente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tipo de registro *"><Select value={form.tipo} onChange={v => set("tipo", v)} options={TIPOS_CAPTURA} /></Field>
        <Field label="Nombre / asunto *"><Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="¿Qué hay que hacer?" /></Field>
        <Field label="Prioridad *"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
        <Field label="Responsable *"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
        <div className="md:col-span-2">
          <Field label="Próxima acción *"><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} placeholder="¿Qué tengo que hacer primero?" /></Field>
        </div>
        <Field label={form.prioridad === "P1 Crítico" ? "Fecha próxima acción *" : "Fecha próxima acción"}>
          <DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} />
        </Field>
        <Field label="Bloqueado por"><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
        <div className="md:col-span-2">
          <Field label="Observación breve"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto opcional..." /></Field>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar captura</button>
      </div>
    </div>
  );
}
