import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { hoy } from "../utils/appHelpers";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { TIPOS_MOVIMIENTO_VALES } from "../domain/options";
import type { ValeGasOrg } from "../domain/types";

export function FormValeGasOrg({ data, editItem, closeModal, saveItem }: any) {
  const today = hoy();
  const defaults: ValeGasOrg = {
    id: "", fechaRegistro: today, periodo: "", tipoMovimiento: "Ingreso de vales",
    cantidadVales: 0, motivo: "", responsableId: "", observaciones: "", ultimaActualizacion: today,
  };
  const { form, set } = useForm(defaults, editItem);
  const [vErr, setVErr] = useState<VError>({});

  const save = () => {
    const errors: VError = {};
    if (!form.fechaRegistro) errors.fechaRegistro = "La fecha de registro es obligatoria.";
    if (!form.periodo?.trim()) errors.periodo = "El período es obligatorio.";
    if (!form.tipoMovimiento) errors.tipoMovimiento = "El tipo de movimiento es obligatorio.";
    if ((form.cantidadVales || 0) <= 0) errors.cantidadVales = "La cantidad de vales debe ser mayor a 0.";
    setVErr(errors);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("valesGasOrganizacion", { ...form, ultimaActualizacion: today });
    closeModal();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2"><h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2">Movimiento de vales — Organización</h3></div>
      <Field label="Fecha de registro *" error={vErr.fechaRegistro}><DateInput value={form.fechaRegistro} onChange={v => set("fechaRegistro", v)} /></Field>
      <Field label="Período *" error={vErr.periodo}><Input value={form.periodo} onChange={e => set("periodo", e.target.value)} placeholder="Ej: Mayo 2026" /></Field>
      <Field label="Tipo de movimiento *" error={vErr.tipoMovimiento}><Select value={form.tipoMovimiento} onChange={v => set("tipoMovimiento", v)} options={TIPOS_MOVIMIENTO_VALES} /></Field>
      <Field label="Cantidad de vales *" error={vErr.cantidadVales}><Input type="number" value={String(form.cantidadVales)} onChange={e => set("cantidadVales", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Motivo"><Input value={form.motivo} onChange={e => set("motivo", e.target.value)} placeholder="Ej: Compra mensual" /></Field>
      <Field label="Responsable"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <div className="md:col-span-2">
        <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto adicional..." /></Field>
      </div>
      <FormMessages errors={vErr} warnings={[]} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
