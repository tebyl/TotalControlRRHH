import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Textarea } from "../components/forms/fields";
import { ValidatedInput } from "../components/forms/ValidatedForm";
import { notifyValidationError } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";

export function FormPresupuesto({ data: _data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ concepto: "", presupuestoTotal: 0, observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});

  const save = () => {
    const errors: VError = {};
    const total = Number(form.presupuestoTotal) || 0;
    if (total < 0) errors.presupuestoTotal = "El presupuesto asignado no puede ser negativo.";
    setVErr(errors);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("presupuesto", { ...form, presupuestoTotal: total });
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-500 border border-slate-200">
        Módulo: <span className="font-semibold text-slate-700">{form.concepto}</span>
      </div>
      <ValidatedInput label="Presupuesto asignado (CLP)" type="number" value={String(form.presupuestoTotal ?? "")} onChange={(v) => set("presupuestoTotal", Number(v) || 0)} error={vErr.presupuestoTotal} required hint="Solo números, sin puntos ni símbolo $" />
      <Field label="Observaciones">
        <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
      </Field>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
