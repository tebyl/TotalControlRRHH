import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { hoy } from "../utils/appHelpers";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { ESTADOS_VALE_GAS } from "../domain/options";
import type { ValeGas } from "../domain/types";

export function FormValesGas({ data, editItem, closeModal, saveItem }: any) {
  const today = hoy();
  const defaults: ValeGas = {
    id: "", colaborador: "", contactoId: "", area: "", periodo: "",
    fechaEntrega: today, totalValesAsignados: 0, valesUsados: 0,
    descuentoDiario: 0, diasDescuento: 0, totalDescontado: 0, saldoVales: 0,
    estado: "Pendiente entregar", responsableId: "", fechaProximaRevision: "",
    observaciones: "", ultimaActualizacion: today,
  };
  const { form, set } = useForm(defaults, editItem);
  const saldoCalculado = (form.totalValesAsignados || 0) - (form.valesUsados || 0);
  const totalDescontadoCalculado = (form.descuentoDiario || 0) * (form.diasDescuento || 0);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);

  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    if (!form.colaborador?.trim()) errors.colaborador = "El nombre del colaborador es obligatorio.";
    if (!form.area?.trim()) errors.area = "El área es obligatoria.";
    if (!form.periodo?.trim()) errors.periodo = "El período es obligatorio.";
    if ((form.totalValesAsignados || 0) < 0) errors.totalValesAsignados = "El total de vales asignados no puede ser negativo.";
    if ((form.valesUsados || 0) < 0) errors.valesUsados = "Los vales usados no pueden ser negativos.";
    if ((form.valesUsados || 0) > (form.totalValesAsignados || 0)) warnings.push("Los vales entregados/utilizados superan los vales asignados al colaborador. Verifique el dato.");
    if (!form.estado) errors.estado = "El estado es obligatorio.";
    if (form.estado === "En descuento" && !form.fechaProximaRevision) errors.fechaProximaRevision = "La fecha de próxima revisión es obligatoria cuando el vale está en descuento.";
    if (form.estado === "Cerrado" && saldoCalculado > 0) warnings.push("El estado es 'Cerrado' pero hay saldo pendiente del colaborador. Verifique si corresponde cerrar el registro.");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("valesGas", { ...form, saldoVales: saldoCalculado, totalDescontado: totalDescontadoCalculado, ultimaActualizacion: today });
    closeModal();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2"><h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2">Información principal</h3></div>
      <Field label="Colaborador *"><Input value={form.colaborador} onChange={e => set("colaborador", e.target.value)} placeholder="Nombre del colaborador" /></Field>
      <Field label="Área *"><Input value={form.area} onChange={e => set("area", e.target.value)} placeholder="Ej: Operaciones" /></Field>
      <Field label="Período *"><Input value={form.periodo} onChange={e => set("periodo", e.target.value)} placeholder="Ej: Mayo 2026" /></Field>
      <Field label="Fecha de entrega"><DateInput value={form.fechaEntrega} onChange={v => set("fechaEntrega", v)} /></Field>
      <Field label="Responsable"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Contacto (opcional)">
        <select value={form.contactoId} onChange={e => set("contactoId", e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors w-full">
          <option value="">Sin contacto asociado</option>
          {(data.contactos || []).filter((c: any) => c.activo !== "No").map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </Field>
      <div className="md:col-span-2"><h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2 mt-2">Control de vales</h3></div>
      <p className="text-xs text-slate-400 col-span-2">Este formulario registra los vales asociados a un colaborador, no el total general de la organización.</p>
      <Field label="Vales asignados al colaborador"><Input type="number" value={String(form.totalValesAsignados)} onChange={e => set("totalValesAsignados", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Vales entregados / utilizados"><Input type="number" value={String(form.valesUsados)} onChange={e => set("valesUsados", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Saldo pendiente del colaborador">
        <div className={`border rounded-lg px-3 py-2 text-sm font-semibold ${saldoCalculado < 0 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-800"}`}>{saldoCalculado} vales</div>
      </Field>
      <Field label="Descuento diario (vales/día)"><Input type="number" value={String(form.descuentoDiario)} onChange={e => set("descuentoDiario", parseFloat(e.target.value) || 0)} /></Field>
      <Field label="Días de descuento"><Input type="number" value={String(form.diasDescuento)} onChange={e => set("diasDescuento", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Total descontado al colaborador">
        <div className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 text-slate-800">{totalDescontadoCalculado} vales</div>
      </Field>
      <div className="md:col-span-2"><h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2 mt-2">Seguimiento</h3></div>
      <Field label="Estado *"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_VALE_GAS} /></Field>
      <Field label="Fecha próxima revisión"><DateInput value={form.fechaProximaRevision} onChange={v => set("fechaProximaRevision", v)} /></Field>
      <div className="md:col-span-2">
        <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto adicional..." /></Field>
      </div>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
