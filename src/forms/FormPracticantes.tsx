import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { ValidatedInput } from "../components/forms/ValidatedForm";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { BLOQUEOS, ESTADOS_PRACTICANTE } from "../domain/options";

export function FormPracticantes({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ nombre: "", area: "", especialidad: "", fechaInicio: "", fechaTermino: "", costoMensual: 0, estado: "Por buscar", responsableId: "", proximoPaso: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "nombre", "Nombre del practicante");
    if (Number(form.costoMensual) < 0) errors.costoMensual = "El costo mensual no puede ser negativo.";
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("practicantes", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nombre" required error={vErr.nombre}><Input value={form.nombre} onChange={e => set("nombre", e.target.value)} /></Field>
      <Field label="Área"><Input value={form.area} onChange={e => set("area", e.target.value)} /></Field>
      <Field label="Especialidad"><Input value={form.especialidad} onChange={e => set("especialidad", e.target.value)} /></Field>
      <Field label="Fecha inicio"><DateInput value={form.fechaInicio} onChange={v => set("fechaInicio", v)} /></Field>
      <Field label="Fecha término"><DateInput value={form.fechaTermino} onChange={v => set("fechaTermino", v)} /></Field>
      <ValidatedInput label="Costo mensual (CLP)" type="number" value={String(form.costoMensual ?? "")} onChange={(v) => set("costoMensual", Number(v) || 0)} error={vErr.costoMensual} hint="Solo números, sin puntos ni símbolo $" />
      <Field label="Estado"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_PRACTICANTE} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Próximo paso"><Input value={form.proximoPaso} onChange={e => set("proximoPaso", e.target.value)} /></Field>
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
