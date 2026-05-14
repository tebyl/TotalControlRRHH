import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { ExpandableSection } from "../components/ui";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { BLOQUEOS, ESTADOS_BUK, ESTADOS_DIPLOMA, PRIORIDADES, TIPOS_DOCUMENTO } from "../domain/options";

export function FormDiplomas({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ cursoAsociado: "", participante: "", tipoDocumento: "Diploma", otec: "", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "", fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir", prioridad: "P3 Medio", responsableId: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "cursoAsociado", "Curso asociado");
    if (!form.participante?.trim()) errors.participante = "El participante es obligatorio.";
    if (form.etapa === "Subir a BUK") {
      if (!form.participante?.trim()) errors.participante = "Para subir a BUK se necesita el participante.";
      if (!form.tipoDocumento) errors.tipoDocumento = "Para subir a BUK se necesita el tipo de documento.";
    }
    if (form.estadoBUK === "Subido" && form.etapa !== "Completado") {
      warnings.push("El estado BUK es \"Subido\" — se recomienda cambiar la etapa a \"Completado\".");
    }
    if (form.etapa === "Completado" && !form.fechaSubidaBUK) {
      warnings.push("El documento está completado pero no tiene fecha de subida a BUK.");
    }
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("diplomas", form);
  };
  const hasDatesFilled = !!(form.fechaSolicitudOTEC || form.fechaRecepcionDoc || form.fechaEnvioParticipante || form.fechaSubidaBUK);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Curso asociado" required error={vErr.cursoAsociado}><Input value={form.cursoAsociado} onChange={e => set("cursoAsociado", e.target.value)} /></Field>
        <Field label="Participante" required error={vErr.participante}><Input value={form.participante} onChange={e => set("participante", e.target.value)} /></Field>
        <Field label="Tipo documento" error={vErr.tipoDocumento}><Select value={form.tipoDocumento} onChange={v => set("tipoDocumento", v)} options={TIPOS_DOCUMENTO} /></Field>
        <Field label="OTEC / Proveedor"><Input value={form.otec} onChange={e => set("otec", e.target.value)} /></Field>
        <Field label="Etapa"><Select value={form.etapa} onChange={v => set("etapa", v)} options={ESTADOS_DIPLOMA} /></Field>
        <Field label="Estado BUK"><Select value={form.estadoBUK} onChange={v => set("estadoBUK", v)} options={ESTADOS_BUK} /></Field>
      </div>
      <ExpandableSection title="📅 Fechas de gestión" defaultOpen={hasDatesFilled}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fecha solicitud a OTEC"><DateInput value={form.fechaSolicitudOTEC} onChange={v => set("fechaSolicitudOTEC", v)} /></Field>
          <Field label="Fecha recepción documento"><DateInput value={form.fechaRecepcionDoc} onChange={v => set("fechaRecepcionDoc", v)} /></Field>
          <Field label="Fecha envío al participante"><DateInput value={form.fechaEnvioParticipante} onChange={v => set("fechaEnvioParticipante", v)} /></Field>
          <Field label="Fecha subida a BUK"><DateInput value={form.fechaSubidaBUK} onChange={v => set("fechaSubidaBUK", v)} /></Field>
        </div>
      </ExpandableSection>
      <ExpandableSection title="🎯 Seguimiento y control" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
          <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
          <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
          <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
          <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
          <div className="md:col-span-2"><Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field></div>
        </div>
      </ExpandableSection>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
