import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { getWeeksForYear } from "../utils/appHelpers";
import { Field, Input, Textarea } from "../components/forms/fields";
import { notifyValidationError, FormMessages } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";

export function FormCargaSemanal({ data: _data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ semana: "", cursosPlanificados: 0, cursosUrgentesNuevos: 0, cursosNoPlanificados: 0, ocsNuevas: 0, diplomasPendientes: 0, procesosBloqueados: 0, comentario: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const save = () => {
    if (!form.semana.trim()) {
      setVErr({ semana: "El campo Semana es obligatorio." });
      notifyValidationError();
      return;
    }
    saveItem("cargaSemanal", form);
  };
  const weeks = getWeeksForYear(new Date().getFullYear());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Semana (Calendario 2026)" required error={vErr.semana}>
        <select value={form.semana} onChange={e => set("semana", e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors w-full">
          <option value="">Seleccionar semana...</option>
          {weeks.map(w => (
            <option key={w.number} value={w.label}>{w.label} ({w.monthLabel} - {w.rangeLabel})</option>
          ))}
        </select>
      </Field>
      <Field label="Cursos planificados"><Input type="number" value={form.cursosPlanificados} onChange={e => set("cursosPlanificados", Number(e.target.value) || 0)} /></Field>
      <Field label="Cursos urgentes nuevos"><Input type="number" value={form.cursosUrgentesNuevos} onChange={e => set("cursosUrgentesNuevos", Number(e.target.value) || 0)} /></Field>
      <Field label="Cursos no planificados necesarios"><Input type="number" value={form.cursosNoPlanificados} onChange={e => set("cursosNoPlanificados", Number(e.target.value) || 0)} /></Field>
      <Field label="OCs nuevas"><Input type="number" value={form.ocsNuevas} onChange={e => set("ocsNuevas", Number(e.target.value) || 0)} /></Field>
      <Field label="Diplomas pendientes"><Input type="number" value={form.diplomasPendientes} onChange={e => set("diplomasPendientes", Number(e.target.value) || 0)} /></Field>
      <Field label="Procesos bloqueados"><Input type="number" value={form.procesosBloqueados} onChange={e => set("procesosBloqueados", Number(e.target.value) || 0)} /></Field>
      <Field label="Comentario"><Textarea value={form.comentario} onChange={e => set("comentario", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={[]} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
