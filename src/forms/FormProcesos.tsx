import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { BLOQUEOS, PRIORIDADES, TIPOS_PROCESO } from "../domain/options";

export function FormProcesos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ proceso: "", tipo: "Curso", estadoActual: "Pendiente", queFalta: "", responsableId: "", fechaLimite: "", riesgo: "", prioridad: "P3 Medio", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "proceso", "Nombre del proceso");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("procesos", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Proceso" required error={vErr.proceso}><Input value={form.proceso} onChange={e => set("proceso", e.target.value)} /></Field>
      <Field label="Tipo"><Select value={form.tipo} onChange={v => set("tipo", v)} options={TIPOS_PROCESO} /></Field>
      <Field label="Estado actual"><Input value={form.estadoActual} onChange={e => set("estadoActual", e.target.value)} /></Field>
      <Field label="Qué falta"><Input value={form.queFalta} onChange={e => set("queFalta", e.target.value)} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Fecha límite"><DateInput value={form.fechaLimite} onChange={v => set("fechaLimite", v)} /></Field>
      <Field label="Riesgo si no se hace"><Input value={form.riesgo} onChange={e => set("riesgo", e.target.value)} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
