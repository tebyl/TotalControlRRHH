import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { ValidatedInput } from "../components/forms/ValidatedForm";
import { ExpandableSection } from "../components/ui";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact, isValidRut } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { BLOQUEOS, ESTADOS_EVALUACION, MESES, PRIORIDADES, RESULTADOS_EVALUACION, TIPOS_EVALUACION } from "../domain/options";

export function FormEvaluaciones({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ mes: "Enero", ano: 2026, cargo: "", area: "", candidato: "", rut: "", tipoEvaluacion: "Psicolaboral", proveedor: "", fechaSolicitud: "", fechaEvaluacion: "", fechaEntregaInforme: "", estado: "Pendiente solicitar", resultado: "Pendiente", prioridad: "P3 Medio", responsableId: "", costo: 0, requiereOC: "No", numeroOC: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const [fieldWarn, setFieldWarn] = useState<Record<string, string>>({});
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "cargo", "Cargo");
    if (!form.candidato?.trim()) errors.candidato = "El nombre del candidato es obligatorio.";
    if (form.estado === "Realizada" && !form.fechaEvaluacion) errors.fechaEvaluacion = "Si la evaluación fue realizada, indica la fecha.";
    if (form.estado === "Informe recibido" && !form.fechaEntregaInforme) errors.fechaEntregaInforme = "Si recibiste el informe, indica la fecha de entrega.";
    if (form.estado === "Cerrada" && form.resultado === "Pendiente") errors.resultado = "No puedes cerrar con resultado Pendiente. Selecciona el resultado.";
    if (form.requiereOC === "Sí" && !form.numeroOC?.trim() && form.bloqueadoPor !== "Falta OC") {
      warnings.push("Requiere OC pero no tiene N° OC ni bloqueo \"Falta OC\". Recuerda gestionarla.");
    }
    if (Number(form.costo) < 0) errors.costo = "El costo no puede ser negativo.";
    const fieldWarnings: Record<string, string> = {};
    const rut = form.rut?.trim();
    if (rut && !isValidRut(rut)) fieldWarnings.rut = "Formato de RUT poco usual.";
    setVErr(errors); setVWarn(warnings);
    setFieldWarn(fieldWarnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("evaluacionesPsicolaborales", { ...form, costo: Number(form.costo) || 0 });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Mes"><Select value={form.mes} onChange={v => set("mes", v)} options={MESES} /></Field>
      <Field label="Año"><Input type="number" value={form.ano} onChange={e => set("ano", Number(e.target.value))} /></Field>
      <Field label="Cargo" required error={vErr.cargo}><Input value={form.cargo} onChange={e => set("cargo", e.target.value)} /></Field>
      <Field label="Área"><Input value={form.area} onChange={e => set("area", e.target.value)} /></Field>
      <Field label="Candidato" required error={vErr.candidato}><Input value={form.candidato} onChange={e => set("candidato", e.target.value)} /></Field>
      <ValidatedInput label="RUT" value={form.rut} onChange={(v) => set("rut", v)} warning={fieldWarn.rut} hint="Ej: 12.345.678-9" />
      <Field label="Tipo evaluación"><Select value={form.tipoEvaluacion} onChange={v => set("tipoEvaluacion", v)} options={TIPOS_EVALUACION} /></Field>
      <Field label="Proveedor / Psicólogo"><Input value={form.proveedor} onChange={e => set("proveedor", e.target.value)} /></Field>
      <Field label="Fecha solicitud"><DateInput value={form.fechaSolicitud} onChange={v => set("fechaSolicitud", v)} /></Field>
      <Field label="Fecha evaluación" error={vErr.fechaEvaluacion}><DateInput value={form.fechaEvaluacion} onChange={v => set("fechaEvaluacion", v)} /></Field>
      <Field label="Fecha entrega informe" error={vErr.fechaEntregaInforme}><DateInput value={form.fechaEntregaInforme} onChange={v => set("fechaEntregaInforme", v)} /></Field>
      <div className="md:col-span-2">
        <ExpandableSection title="Seguimiento y control" defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Estado"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_EVALUACION} /></Field>
            <Field label="Resultado" error={vErr.resultado}><Select value={form.resultado} onChange={v => set("resultado", v)} options={RESULTADOS_EVALUACION} /></Field>
            <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
            <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
            <ValidatedInput label="Costo (CLP)" type="number" value={String(form.costo ?? "")} onChange={(v) => set("costo", Number(v) || 0)} error={vErr.costo} hint="Solo números, sin puntos ni símbolo $" />
            <Field label="Requiere OC"><Select value={form.requiereOC} onChange={v => set("requiereOC", v)} options={["Sí", "No"]} /></Field>
            <Field label="N° OC asociada"><Input value={form.numeroOC} onChange={e => set("numeroOC", e.target.value)} /></Field>
            <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
            <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
            <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
            <div className="md:col-span-2">
              <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
            </div>
          </div>
        </ExpandableSection>
      </div>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
