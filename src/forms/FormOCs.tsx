import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { hoy } from "../utils/appHelpers";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { ValidatedInput } from "../components/forms/ValidatedForm";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { BLOQUEOS, CATEGORIAS_OC, ESTADOS_OC, PRIORIDADES } from "../domain/options";

export function FormOCs({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ numeroOC: "", categoriaOC: "", cursoAsociado: "", proveedor: "", monto: 0, fechaSolicitud: hoy(), fechaLimite: "", estadoOC: "Pendiente crear", prioridad: "P3 Medio", accionPendiente: "", responsableId: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "numeroOC", "N° OC o servicio");
    if (Number(form.monto) < 0) errors.monto = "El monto no puede ser negativo.";
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("ocs", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="N° OC" required error={vErr.numeroOC}><Input value={form.numeroOC} onChange={e => set("numeroOC", e.target.value)} /></Field>
      <Field label="Categoría OC" required><Select value={form.categoriaOC} onChange={v => set("categoriaOC", v)} options={CATEGORIAS_OC} placeholder="Seleccionar categoría..." /></Field>
      <Field label="Curso / Servicio asociado"><Input value={form.cursoAsociado} onChange={e => set("cursoAsociado", e.target.value)} /></Field>
      <Field label="Proveedor"><Input value={form.proveedor} onChange={e => set("proveedor", e.target.value)} /></Field>
      <ValidatedInput label="Monto (CLP)" type="number" value={String(form.monto ?? "")} onChange={(v) => set("monto", Number(v) || 0)} error={vErr.monto} hint="Solo números, sin puntos ni símbolo $" />
      <Field label="Fecha solicitud"><DateInput value={form.fechaSolicitud} onChange={v => set("fechaSolicitud", v)} /></Field>
      <Field label="Fecha límite"><DateInput value={form.fechaLimite} onChange={v => set("fechaLimite", v)} /></Field>
      <Field label="Estado OC"><Select value={form.estadoOC} onChange={v => set("estadoOC", v)} options={ESTADOS_OC} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Acción pendiente"><Input value={form.accionPendiente} onChange={e => set("accionPendiente", e.target.value)} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
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
